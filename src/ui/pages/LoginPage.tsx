import React from "react";

const LoginPage = ({ setPage }: any) => {
  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={() => setPage("home")}
        className="px-6 py-3 bg-sky-600 text-white rounded-xl"
      >
        ログイン（仮）
      </button>
    </div>
  );
};

export default LoginPage;