// Next, React
import { FC, useEffect, useState } from "react";
// Wallet
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

// Components
import pkg from "../../../package.json";

// Store
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";
import { CounterView } from "views/counter";
import { GalleryView } from "views/gallery";
import { MintView } from "views/mint";

export const HomeView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { getUserSOLBalance } = useUserSOLBalanceStore();

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
      getUserSOLBalance(wallet.publicKey, connection);
    }
  }, [wallet.publicKey, connection, getUserSOLBalance]);

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className="mt-6">
          <div className="text-sm font-normal align-bottom text-right text-slate-600 mt-4">
            v{pkg.version}
          </div>
          <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            Solana Click Counter
          </h1>
        </div>

        <div>
          <CounterView></CounterView>
          <MintView></MintView>
          <GalleryView></GalleryView>
        </div>
      </div>
    </div>
  );
};
