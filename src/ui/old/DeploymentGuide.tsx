import React from 'react';
import { GlobeAltIcon, ArrowPathIcon, CheckCircleIcon, ClipboardIcon, ShieldCheckIcon } from './Icons.tsx';
import { WEB_APP_URL, SPREADSHEET_ID, APP_VERSION, REQUIRED_BACKEND_VERSION } from '../constants.ts';

const DeploymentGuide: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto text-left">
            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
                <h3 className="text-2xl font-black flex items-center gap-3"><GlobeAltIcon className="h-8 w-8 text-sky-400" />システム運用ガイド</h3>
                <p className="mt-4 text-slate-400 text-sm leading-relaxed">
                    GASのデプロイURLが変更された場合は <code>constants.ts</code> の <code>WEB_APP_URL</code> を更新してください。
                </p>
            </div>
        </div>
    );
};
export default DeploymentGuide;