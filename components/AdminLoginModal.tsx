import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, LoadingIcon } from './Icons';

interface AdminLoginModalProps {
  onClose: () => void;
  onLogin: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [error]);

  const handleLoginClick = async () => {
    setIsLoading(true);
    setError('');
    const result = await onLogin(password.trim()); // Trim password before sending
    if (!result.success) {
      setError(result.error || 'ログインに失敗しました。');
      setPassword('');
    }
    // On success, the parent closes the modal.
    setIsLoading(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="admin-login-modal-title" className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h3 id="admin-login-modal-title" className="text-lg font-semibold">管理者ログイン</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><CloseIcon /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-slate-700">管理者パスワード</label>
            <input
              ref={passwordInputRef}
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(''); // Clear error on new input
              }}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              onKeyPress={(e) => e.key === 'Enter' && handleLoginClick()}
              autoFocus
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleLoginClick}
            className="w-full h-10 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-700 transition flex items-center justify-center disabled:bg-slate-400 disabled:cursor-wait"
            disabled={!password || isLoading}
          >
            {isLoading ? <LoadingIcon /> : 'ログイン'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;