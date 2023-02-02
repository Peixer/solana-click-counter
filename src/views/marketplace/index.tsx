// Next, React
import { FC, useEffect, useState } from "react";
// Wallet
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

// Components
import pkg from "../../../package.json";
import { AuctionHouseProgram } from "@metaplex-foundation/mpl-auction-house";

// Store
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";
import { CounterView } from "views/counter";
import { GalleryView } from "views/gallery";
import { MintView } from "views/mint";
import {
  AuctionHouse,
  CreateAuctionHouseOutput,
  Metadata,
  Metaplex,
  Nft,
  PublicKey,
  SolAmount,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";
import {
  Keypair,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  createPrintListingReceiptInstruction,
  createSellInstruction,
} from "@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions";

export const MarketplaceView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { getUserSOLBalance } = useUserSOLBalanceStore();
  const mx = Metaplex.make(connection);
  const [auctionHouse, setAuctionHouse] = useState(null);
  const [nft, setNft] = useState(null);
  const [status, setStatus] = useState("");

  const WRAPPED_SOL_MINT = new PublicKey(
    "So11111111111111111111111111111111111111112"
  );

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
      getUserSOLBalance(wallet.publicKey, connection);
    }
  }, [wallet.publicKey, connection, getUserSOLBalance]);

  const fetchNft = async () => {
    setStatus("loading");
    let assets: any = await mx
      .nfts()
      .findAllByOwner({ owner: wallet.publicKey });

    let assetsLoaded = [];
    for (let index = 0; index < assets.length; index++) {
      const element: Metadata = assets[index];
      assetsLoaded.push(await mx.nfts().load({ metadata: element }));
    }

    setNft(assetsLoaded);
    setStatus("done!");
  };

  const createStore = async () => {
    mx.use(walletAdapterIdentity(wallet));

    try {
      let auctionHouseByCreator = await mx.auctionHouse().findByCreatorAndMint({
        creator: wallet.publicKey,
        treasuryMint: WRAPPED_SOL_MINT,
      });
      setAuctionHouse(auctionHouseByCreator);
    } catch (error) {
      const auctionHouse = await mx.auctionHouse().create({
        sellerFeeBasisPoints: 500,
        authority: mx.identity(),
        requiresSignOff: false,
        canChangeSalePrice: true,
      });
      setAuctionHouse(auctionHouse);
    }
  };

  // const createListing = async (nftParam: Nft) => {
  //   mx.use(walletAdapterIdentity(wallet));
  //   try {
  //     // mx.auctionHouse().builders().list({

  //     // })

  //     let auctionHouseByCreator = await mx.auctionHouse().findByCreatorAndMint({
  //       creator: wallet.publicKey,
  //       treasuryMint: WRAPPED_SOL_MINT,
  //     });
  //     debugger;
  //     const listtx = await mx
  //       .auctionHouse()
  //       .builders()
  //       .list({
  //         auctionHouse: auctionHouseByCreator, // A model of the Auction House related to this listing
  //         seller: Keypair.generate(), // Creator of a listing
  //         authority: Keypair.generate(),
  //         // authority: wallet.publicKey, // The Auction House authority
  //         mintAccount: nftParam.address, // The mint account to create a listing for, used to find the metadata
  //         tokenAccount: nftParam.address, // The token account address that's associated to the asset a listing created is for,
  //         price: 1.2000 as any,
  //       });
  //     debugger;
  //     var rpcClient = await mx.rpc().sendTransaction(listtx);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const createListing = async (nftParam: Nft) => {
  //   mx.use(walletAdapterIdentity(wallet));
  //   try {
  //     // mx.auctionHouse().builders().list({

  //     // })

  //     let auctionHouseByCreator = await mx.auctionHouse().findByCreatorAndMint({
  //       creator: wallet.publicKey,
  //       treasuryMint: WRAPPED_SOL_MINT,
  //     });
  //     debugger;
  //     const listtx = await mx
  //       .auctionHouse()
  //       .builders()
  //       .list({
  //         auctionHouse: auctionHouseByCreator, // A model of the Auction House related to this listing
  //         seller: Keypair.generate(), // Creator of a listing
  //         authority: Keypair.generate(),
  //         // authority: wallet.publicKey, // The Auction House authority
  //         mintAccount: nftParam.address, // The mint account to create a listing for, used to find the metadata
  //         tokenAccount: nftParam.address, // The token account address that's associated to the asset a listing created is for,
  //         price: 1.2000 as any,
  //       });
  //     debugger;
  //     var rpcClient = await mx.rpc().sendTransaction(listtx);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const createListing = async (amount, nft: Nft) => {
    mx.use(walletAdapterIdentity(wallet));
    const { publicKey } = wallet;
    let auctionHouse2 = await mx.auctionHouse().findByCreatorAndMint({
      creator: wallet.publicKey,
      treasuryMint: WRAPPED_SOL_MINT,
    });
    // const auctionHouse2: CreateAuctionHouseOutput = await mx.auctionHouse().create({
    //   sellerFeeBasisPoints: 500,
    //   authority: mx.identity().publicKey,
    //   requiresSignOff: false,
    //   canChangeSalePrice: true,
    //   treasuryMint: WRAPPED_SOL_MINT
    // });
    debugger;
    const ah: AuctionHouse = auctionHouse2;
    const buyerPrice = amount;
    const auctionHouse = new PublicKey(ah.address);
    const authority = new PublicKey(ah.authorityAddress);
    const auctionHouseFeeAccount = new PublicKey(ah.feeAccountAddress);
    const treasuryMint = new PublicKey(ah.treasuryMint.address);
    const tokenMint = new PublicKey(nft.mint.address);
    const metadata = new PublicKey(nft.metadataAddress);

    const associatedTokenAccount = new PublicKey(
      // nft.edition.address
      nft.tokenStandard
      // nft.owner.associatedTokenAccountAddress
    );

    const [sellerTradeState, tradeStateBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        publicKey,
        auctionHouse,
        associatedTokenAccount,
        treasuryMint,
        tokenMint,
        buyerPrice,
        1
      );

    const [programAsSigner, programAsSignerBump] =
      await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress();

    const [freeTradeState, freeTradeBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        publicKey,
        auctionHouse,
        associatedTokenAccount,
        treasuryMint,
        tokenMint,
        0,
        1
      );

    const txt = new Transaction();

    const sellInstructionArgs = {
      tradeStateBump,
      freeTradeStateBump: freeTradeBump,
      programAsSignerBump: programAsSignerBump,
      buyerPrice,
      tokenSize: 1,
    };

    const sellInstructionAccounts = {
      wallet: publicKey,
      tokenAccount: associatedTokenAccount,
      metadata: metadata,
      authority: authority,
      auctionHouse: auctionHouse,
      auctionHouseFeeAccount: auctionHouseFeeAccount,
      sellerTradeState: sellerTradeState,
      freeSellerTradeState: freeTradeState,
      programAsSigner: programAsSigner,
    };

    const sellInstruction = createSellInstruction(
      sellInstructionAccounts,
      sellInstructionArgs
    );

    const [receipt, receiptBump] =
      await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState);

    const printListingReceiptInstruction = createPrintListingReceiptInstruction(
      {
        receipt,
        bookkeeper: publicKey,
        instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
      },
      {
        receiptBump,
      }
    );

    txt.add(sellInstruction).add(printListingReceiptInstruction);

    let latestBlockhash = await connection.getLatestBlockhash();

    // Send transaction and await for signature
    const signature = await wallet.sendTransaction(txt, connection);

    // Send transaction and await for signature
    await connection.confirmTransaction(
      { signature, ...latestBlockhash },
      "confirmed"
    );
    // var rpcClient = await mx.rpc().sendTransaction(txt);
  };

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className="mt-6">
          <div className="text-sm font-normal align-bottom text-right text-slate-600 mt-4">
            v{pkg.version}
          </div>
          <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            Solana Market
          </h1>
        </div>

        <div>
          <button
            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black  grid w-full"
            onClick={createStore}
          >
            <span>Create Store</span>
          </button>
          <button
            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black  grid w-full"
            onClick={fetchNft}
          >
            <span>SHOW MY NFTS </span>
          </button>

          <h1 className="place-content-center flex">{status}</h1>
          <div className="hero-content grid-cols-3">
            {nft &&
              nft.map((x) => (
                <>
                  <div
                    key={x.uri}
                    className="h-60 w-60 flex-row flex-wrap"
                    onClick={async () => await createListing(1, x as any)}
                  >
                    <h1>{x.name}</h1>
                    <h3>{x.symbol}</h3>
                    <img
                      src={x.json.image}
                      alt="The downloaded illustration of the provided NFT address."
                    />
                  </div>
                </>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
