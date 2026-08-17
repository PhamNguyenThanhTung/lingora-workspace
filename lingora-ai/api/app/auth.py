from typing import Optional, Dict, Any
import jwt
from fastapi import Header, HTTPException, status
from app.config import settings

_jwks_client: Optional[jwt.PyJWKClient] = None


def get_jwks_client() -> jwt.PyJWKClient:
    """
    Returns a singleton PyJWKClient configured with the trusted Supabase JWKS endpoint.
    Caches keys in memory to minimize network lookups while supporting key rotation.
    """
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(
            uri=settings.jwks_endpoint,
            cache_keys=True,
            max_cached_keys=16
        )
    return _jwks_client


def reset_jwks_client() -> None:
    """Resets the singleton JWKS client (primarily used in tests)."""
    global _jwks_client
    _jwks_client = None


def verify_bearer_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Validates Bearer JWT issued by Supabase.
    Supports:
      - ES256 (asymmetric ECDSA P-256 via Supabase JWKS)
      - HS256 (symmetric HMAC via SUPABASE_JWT_SECRET for backward compatibility/offline tests)

    Validates:
      - Header presence and Bearer format
      - Algorithm whitelist (ES256, HS256)
      - Cryptographic signature verification
      - Token not expired (exp)
      - sub claim presence and non-empty string
      - role claim is 'authenticated'
      - aud claim is 'authenticated' (when present)
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Missing Authorization header with Bearer token.",
                "detail": {"field": "Authorization"}
            }
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Invalid Authorization header format. Expected 'Bearer <token>'.",
                "detail": {"field": "Authorization"}
            }
        )

    token = parts[1]

    try:
        unverified_headers = jwt.get_unverified_header(token)
        alg = unverified_headers.get("alg")

        if alg == "ES256":
            kid = unverified_headers.get("kid")
            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "code": "UNAUTHORIZED",
                        "message": "ES256 token is missing required 'kid' in header.",
                        "detail": {"reason": "missing_kid"}
                    }
                )

            try:
                jwks_client = get_jwks_client()
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                key = signing_key.key
            except jwt.PyJWKClientError as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "code": "UNAUTHORIZED",
                        "message": f"Unable to resolve public key from JWKS: {str(e)}",
                        "detail": {"reason": "jwks_key_not_found"}
                    }
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "code": "UNAUTHORIZED",
                        "message": f"JWKS verification service unavailable: {str(e)}",
                        "detail": {"reason": "jwks_unavailable"}
                    }
                )

            payload = jwt.decode(
                token,
                key,
                algorithms=["ES256"],
                options={"verify_signature": True, "verify_exp": True, "verify_aud": False}
            )

        elif alg == "HS256":
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_signature": True, "verify_exp": True, "verify_aud": False}
            )

        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "UNAUTHORIZED",
                    "message": f"Unsupported algorithm '{alg}'. Only ES256 and HS256 are permitted.",
                    "detail": {"expected_alg": "ES256, HS256", "actual_alg": alg}
                }
            )

        sub = payload.get("sub")
        if not sub or not isinstance(sub, str) or not sub.strip():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "UNAUTHORIZED",
                    "message": "Token is missing a valid 'sub' claim.",
                    "detail": {"claim": "sub"}
                }
            )

        role = payload.get("role")
        if role != "authenticated":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "UNAUTHORIZED",
                    "message": f"Invalid role '{role}'. Expected 'authenticated'.",
                    "detail": {"expected_role": "authenticated", "actual_role": role}
                }
            )

        aud = payload.get("aud")
        if aud and aud != "authenticated":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "UNAUTHORIZED",
                    "message": f"Invalid audience '{aud}'. Expected 'authenticated'.",
                    "detail": {"expected_aud": "authenticated", "actual_aud": aud}
                }
            )

        return payload

    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Token has expired.",
                "detail": {"reason": "token_expired"}
            }
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHORIZED",
                "message": f"Invalid token signature or payload: {str(e)}",
                "detail": {"reason": "invalid_signature"}
            }
        )
