// Next, React
import { FC, useEffect, useState } from "react";
import * as borsh from "borsh";

// Wallet
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

export const CounterView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  let greetedPubkey: PublicKey;
  const programId = new PublicKey(
    `4MSSxNPPKtNAJaXGUy7P1jFUKNasC9oSWx1GHGUYDnZN`
  );

  /**
   * The state of a greeting account managed by the hello world program
   */
  class GreetingAccount {
    counter = 0;
    constructor(fields: { counter: number } | undefined = undefined) {
      if (fields) {
        this.counter = fields.counter;
      }
    }
  }

  /**
   * Borsh schema definition for greeting accounts
   */
  const GreetingSchema = new Map([
    [GreetingAccount, { kind: "struct", fields: [["counter", "u32"]] }],
  ]);

  /**
   * The expected size of each greeting account.
   */
  const GREETING_SIZE = borsh.serialize(
    GreetingSchema,
    new GreetingAccount()
  ).length;

  async function incrementCount() {
    await checkProgram();
    await sayHello();
    await reportGreetings();
  }

  async function checkProgram(): Promise<void> {
    const programInfo = await connection.getAccountInfo(programId);
    if (programInfo === null) {
      throw new Error("Program needs to be built and deployed");
    } else if (!programInfo.executable) {
      throw new Error(`Program is not executable`);
    }
    console.log(`Using program ${programId.toBase58()}`);

    // Derive the address (public key) of a greeting account from the program so that it's easy to find later.
    const GREETING_SEED = "hello";
    greetedPubkey = await PublicKey.createWithSeed(
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
      const lamports = await connection.getMinimumBalanceForRentExemption(
        GREETING_SIZE
      );

      const transaction = new Transaction().add(
        SystemProgram.createAccountWithSeed({
          fromPubkey: wallet.publicKey,
          basePubkey: wallet.publicKey,
          seed: GREETING_SEED,
          newAccountPubkey: greetedPubkey,
          lamports,
          space: GREETING_SIZE,
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
  }

  async function sayHello(): Promise<void> {
    console.log("Saying hello to", greetedPubkey.toBase58());
    const instruction = new TransactionInstruction({
      keys: [{ pubkey: greetedPubkey, isSigner: false, isWritable: true }],
      programId,
      data: Buffer.alloc(0), // All instructions are hellos
    });

    let latestBlockhash = await connection.getLatestBlockhash();
    const transaction = new Transaction().add(instruction);

    // Send transaction and await for signature
    const signature = await wallet.sendTransaction(transaction, connection);

    // Send transaction and await for signature
    await connection.confirmTransaction(
      { signature, ...latestBlockhash },
      "confirmed"
    );
  }

  async function reportGreetings(): Promise<void> {
    const accountInfo = await connection.getAccountInfo(greetedPubkey);
    if (accountInfo === null) {
      throw "Error: cannot find the greeted account";
    }
    const greeting = borsh.deserialize(
      GreetingSchema,
      GreetingAccount,
      accountInfo.data
    );
    
    console.log(
      greetedPubkey.toBase58(),
      "has been greeted",
      greeting.counter,
      "time(s)"
    );
  }

  return (
    <>
      <button
        className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
        onClick={incrementCount}
      >
        <span>COUNT +1 </span>
      </button>
    </>
  );
};
