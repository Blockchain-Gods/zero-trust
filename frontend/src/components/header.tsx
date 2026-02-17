// "use client";

import { WalletButton } from "./wallet-button";

const Header = () => {
  return (
    <header className="w-full bg-[#1a2332]/90 backdrop-blur-sm border-b-2 border-[#00e5ff]/60 px-6 py-3">
      <div className="max-w-450 mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="text-[#00e5ff] font-bold text-xl font-mono tracking-wider">
          ZERO TRUST
        </div>
        <WalletButton />
      </div>
    </header>
  );
};

export default Header;
