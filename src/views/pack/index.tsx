// Next, React
import { FC, useEffect, useState } from "react";
// Wallet
import {
  useWallet,
  useConnection,
  useLocalStorage,
} from "@solana/wallet-adapter-react";
// Components
import pkg from "../../../package.json";
import md5 from "md5";

import * as borsh from "borsh";
// Store
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";
import {
  bundlrStorage,
  BundlrStorageDriver,
  CandyMachineV2Item,
  Metaplex,
  PublicKey,
  toBigNumber,
  toMetaplexFileFromBrowser,
  UploadMetadataOutput,
  walletAdapterIdentity,
  toDateTime,
  getMerkleRoot,
  sol,
  getMerkleProof,
} from "@metaplex-foundation/js";
import {
  Keypair,
  Transaction,
  TransactionInstruction,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import {
  createInitPackInstruction,
  PackDistributionType,
  PackSetArgs,
  PackSet,
} from "@metaplex-foundation/mpl-nft-packs";
import { Store, StoreData } from "@metaplex-foundation/mpl-metaplex";

export const PackView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { getUserSOLBalance } = useUserSOLBalanceStore();
  const mx = Metaplex.make(connection);

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
      getUserSOLBalance(wallet.publicKey, connection);
    }
  }, [wallet.publicKey, connection, getUserSOLBalance]);

  const createPackNft = async () => {
    mx.use(walletAdapterIdentity(wallet));
    const packSet = Keypair.generate();
    const store = Keypair.generate();

    // const programId = new PublicKey(
    //   "packFeFNZzMfD9aVWL7QbGz1WcU7R9zpf6pvNsw2BLu"
    // );
    const programId = new PublicKey(
      "G7TFbCkgPr9rMJhkbZcMKSpKZC84i3re1ujc4kYec9b7"
    );

    // // Derive the address (public key) of a greeting account from the program so that it's easy to find later.
    const GREETING_SEED = "pack";
    const greetedPubkey = await PublicKey.createWithSeed(
      wallet.publicKey,
      GREETING_SEED,
      programId
    );

    // Check if the greeting account has already been created
    const greetedAccount = await connection.getAccountInfo(greetedPubkey);
    if (greetedAccount === null) {
      console.log(
        "Creating account",
        greetedPubkey.toBase58(),
        "to say hello to"
      );
      const lamports = await connection.getMinimumBalanceForRentExemption(100);

      const transaction = new Transaction().add(
        SystemProgram.createAccountWithSeed({
          fromPubkey: wallet.publicKey,
          basePubkey: wallet.publicKey,
          seed: GREETING_SEED,
          newAccountPubkey: greetedPubkey,
          lamports,
          space: 100,
          programId,
        })
      );

      let latestBlockhash = await connection.getLatestBlockhash();

      // Send transaction and await for signature
      const signature = await wallet.sendTransaction(transaction, connection);

      // Send transaction and await for signature
      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        "confirmed"
      );
    }
    const initPack = {
      allowedAmountToRedeem: 10,
      description: `lala`,
      distributionType: PackDistributionType.MaxSupply,
      mutable: true,
      redeemStartDate: toBigNumber(toDateTime("2023-02-10T15:30:00.000Z")),
      redeemEndDate: toBigNumber(toDateTime("2023-02-12T15:30:00.000Z")),
      name: [...Array(32).keys()],
      uri: `https://arweave.net/Jfl5PEhx7X9ck-8CXbbtlrJtSuRcH3EUtZrF5n-6xiI`
    };
    const instruction = createInitPackInstruction(
      {
        authority: mx.identity().publicKey,
        clock: SYSVAR_CLOCK_PUBKEY,
        packSet: mx.identity().publicKey,
        rent: SYSVAR_RENT_PUBKEY,
      },
      {
        initPackSetArgs: initPack,
      },
      new PublicKey("G7TFbCkgPr9rMJhkbZcMKSpKZC84i3re1ujc4kYec9b7")
    );
    instruction.keys[2] = {
      pubkey: SYSVAR_RENT_PUBKEY,
      isWritable: false,
      isSigner: false,
    };

    let latestBlockhash = await connection.getLatestBlockhash();
    const transaction = new Transaction().add(instruction);
    debugger;

    // Send transaction and await for signature
    const signature = await wallet.sendTransaction(transaction, connection);

    // Send transaction and await for signature
    await connection.confirmTransaction(
      { signature, ...latestBlockhash },
      "confirmed"
    );
  };

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className="mt-6">
          <div className="text-sm font-normal align-bottom text-right text-slate-600 mt-4">
            v{pkg.version}
          </div>
          <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            Solana PACK NFT
          </h1>
        </div>

        <div>
          <button
            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black  grid w-full"
            onClick={createPackNft}
          >
            <span>NEW PACK NFT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
