'use client';

import React, { useState } from 'react';

interface VerifyFormProps {
  tokenHash: string;
  type: string;
}

export function VerifyForm({ tokenHash, type }: VerifyFormProps) {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = () => {
    setTimeout(() => {
      setIsPending(true);
    }, 0);
  };

  return (
    <form
      method="post"
      action="/auth/confirm"
      className="login-form"
      onSubmit={handleSubmit}
      style={{ width: '100%', boxSizing: 'border-box' }}
    >
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <button
        type="submit"
        id="verifySubmitBtn"
        className="btn btn-primary"
        disabled={isPending}
        style={{ width: '100%', marginTop: '16px', boxSizing: 'border-box' }}
      >
        {isPending ? 'Đang xác nhận...' : 'Xác nhận email'}
      </button>
    </form>
  );
}
