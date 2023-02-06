// Next, React
import { FC, useState } from "react";

// Wallet
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Metaplex,
  PublicKey,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";

export const MintView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const mx = Metaplex.make(connection);

  const fetchNft = async () => {
    mx.use(walletAdapterIdentity(wallet));
    const candyMachine = await mx
      .candyMachines()
      .findByAddress({
        address: new PublicKey(`2Zi7tR744TytMeYNSSqVvZ34LSxW5cyYRBfvQ8R6Djqe`),
      });

    await mx.candyMachines().mint({
      candyMachine,
      collectionUpdateAuthority: candyMachine.authorityAddress,
    });
  };

  return (
    <>
      <button
        className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black  grid w-full"
        onClick={fetchNft}
      >
        <span>MINT A CRAB</span>
      </button>
      <button
        className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black  grid w-full"
        onClick={fetchNft}
      >
        <span>I am lucky today!</span>
      </button>
    </>
  );
};
