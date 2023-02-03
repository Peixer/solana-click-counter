// Next, React
import { FC, useEffect, useState } from "react";
// Wallet
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
// Components
import pkg from "../../../package.json";

// Store
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";
import {
  Metadata,
  Metaplex,
  Nft,
  PublicKey,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const MarketplaceView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { getUserSOLBalance } = useUserSOLBalanceStore();
  const mx = Metaplex.make(connection);
  const [auctionHouse, setAuctionHouse] = useState(null);
  const [nft, setNft] = useState(null);
  const [status, setStatus] = useState("");
  const [listings, setListings] = useState([]);

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

  const createListing = async (amount, nftParam: Nft) => {
    mx.use(walletAdapterIdentity(wallet));
    try {
      let auctionHouseByCreator = await mx.auctionHouse().findByCreatorAndMint({
        creator: wallet.publicKey,
        treasuryMint: WRAPPED_SOL_MINT,
      });
      
      await mx.auctionHouse().list({
        auctionHouse: auctionHouseByCreator,
        seller: mx.identity(),
        mintAccount: nftParam.mint.address,
        price: {
          basisPoints: amount,
          currency: { decimals: 9, symbol: "SOL" },
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchListing = async () => {
    let auctionHouseByCreator: any = await mx
      .auctionHouse()
      .findByCreatorAndMint({
        creator: wallet.publicKey,
        treasuryMint: WRAPPED_SOL_MINT,
      });

    const listings: any = await mx
      .auctionHouse()
      .findListings({ auctionHouse: auctionHouseByCreator });

    for (let index = 0; index < listings.length; index++) {
      const element = listings[index].metadataAddress;
      listings[index].nft = await mx
        .nfts()
        .findByMetadata({ metadata: element });
    }
    
    setListings(listings);
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
            onClick={fetchListing}
          >
            <span>SHOW MY LISTINGS </span>
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
          <div className="hero-content grid-cols-3">
            {listings &&
              listings.map((x) => (
                <>
                  <div key={x.nft.uri} className="h-60 w-60 flex-row flex-wrap">
                    <h1>
                      {x.nft.name} - SOL {x.price?.basisPoints.toNumber()}
                    </h1>
                    <h3>{x.nft.symbol}</h3>
                    <img
                      src={x.nft.json.image}
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
