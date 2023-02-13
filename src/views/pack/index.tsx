// Next, React
import { FC, useEffect } from "react";
// Wallet
import {
  useWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
// Components
import pkg from "../../../package.json";

// Store
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";
import {
  Metaplex,
  PublicKey,
  toBigNumber,
  walletAdapterIdentity,
  toDateTime,
} from "@metaplex-foundation/js";
import {
  Transaction,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  AccountInfo,
} from "@solana/web3.js";
import {
  createInitPackInstruction,
  PackDistributionType,
} from "glaicon-nft-packs";

export const PackView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { getUserSOLBalance } = useUserSOLBalanceStore();
  const mx = Metaplex.make(connection);
  const PROGRAM_ID = new PublicKey(
    "G7TFbCkgPr9rMJhkbZcMKSpKZC84i3re1ujc4kYec9b7"
  );

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
      getUserSOLBalance(wallet.publicKey, connection);
    }
  }, [wallet.publicKey, connection, getUserSOLBalance]);

  const createPackNft = async () => {
    mx.use(walletAdapterIdentity(wallet));

    // // Derive the address (public key) of a greeting account from the program so that it's easy to find later.
    const GREETING_SEED = "packs";
    const greetedPubkey = await PublicKey.createWithSeed(
      wallet.publicKey,
      GREETING_SEED,
      PROGRAM_ID
    );

    // Check if the greeting account has already been created
    await createOrGetPackNftAccount(GREETING_SEED, greetedPubkey);

    const initPack = {
      allowedAmountToRedeem: 10,
      description: `lala`,
      distributionType: PackDistributionType.MaxSupply,
      mutable: true,
      redeemStartDate: toBigNumber(toDateTime("2023-02-10T15:30:00.000Z")),
      redeemEndDate: toBigNumber(toDateTime("2023-02-12T15:30:00.000Z")),
      name: [...Array(32).keys()],
      uri: `https://arweave.net/Jfl5PEhx7X9ck-8CXbbtlrJtSuRcH3EUtZrF5n-6xiI`,
    };
    const instruction = createInitPackInstruction(
      {
        authority: mx.identity().publicKey,
        clock: SYSVAR_CLOCK_PUBKEY,
        packSet: greetedPubkey,
        rent: SYSVAR_RENT_PUBKEY,
      },
      {
        initPackSetArgs: initPack,
      },
      PROGRAM_ID
    );

    let latestBlockhash = await connection.getLatestBlockhash();
    const transaction = new Transaction().add(instruction);

    // Send transaction and await for signature
    const signature = await wallet.sendTransaction(transaction, connection);

    // Send transaction and await for signature
    await connection.confirmTransaction(
      { signature, ...latestBlockhash },
      "confirmed"
    );
  };

  const createOrGetPackNftAccount = async (GREETING_SEED: String, greetedPubkey: PublicKey): Promise<AccountInfo<Buffer> | null> => {
    // Check if the greeting account has already been created
    const greetedAccount = await connection.getAccountInfo(greetedPubkey);
    if (greetedAccount === null) {
      console.log(
        "Creating account",
        greetedPubkey.toBase58(),
        "to say hello to"
      );
      const lamports = await connection.getMinimumBalanceForRentExemption(885);

      const transaction = new Transaction().add(
        SystemProgram.createAccountWithSeed({
          fromPubkey: wallet.publicKey,
          basePubkey: wallet.publicKey,
          seed: GREETING_SEED,
          newAccountPubkey: greetedPubkey,
          lamports,
          space: 885,
          programId: PROGRAM_ID,
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

    return greetedAccount;
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
