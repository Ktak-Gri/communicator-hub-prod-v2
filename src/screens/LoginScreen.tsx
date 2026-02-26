import { useNavigate } from "react-router-dom";

export default function LoginScreen() {

  const navigate = useNavigate();

  const handleLogin = () => {
    // 将来Auth接続
    navigate("/training");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">

      <div className="bg-white p-10 rounded-xl shadow w-80">

        <h1 className="text-xl font-bold mb-6 text-center">
          Communicator Hub
        </h1>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded"
        >
          ログイン
        </button>

      </div>

    </div>
  );
}