import React from "react";
import { ActivePage } from "../../types";

type Props = {
  navigate: (page: ActivePage) => void;
};

const LoginPage: React.FC<Props> = ({ navigate }) => {

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={() => navigate("home")}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg"
      >
        Login
      </button>
    </div>
  );
};

export default LoginPage;