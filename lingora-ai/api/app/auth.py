from typing import Optional, Dict, Any
import jwt
from fastapi import Header, HTTPException, status
from app.config import settings


def verify_bearer_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Validates offline HS256 Bearer JWT against SUPABASE_JWT_SECRET.
    Guarantees zero database or network calls.
    Validates:
      - Header presence and Bearer format
      - HS256 algorithm enforcement
      - Valid signature
      - Token not expired (exp)
      - sub claim presence and non-empty string
      - role claim is authenticated
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
        # Strictly enforce HS256 algorithm
        unverified_headers = jwt.get_unverified_header(token)
        if unverified_headers.get("alg") != "HS256":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "UNAUTHORIZED",
                    "message": f"Unsupported algorithm '{unverified_headers.get('alg')}'. Only HS256 is permitted.",
                    "detail": {"expected_alg": "HS256"}
                }
            )

        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_signature": True, "verify_exp": True}
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
