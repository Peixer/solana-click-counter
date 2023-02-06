// Next, React
import { FC, useState } from "react";

// Wallet
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Metadata, Metaplex } from "@metaplex-foundation/js";

export const GalleryView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const mx = Metaplex.make(connection);
  const [nft, setNft] = useState(null);
  const [status, setStatus] = useState("");

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

  return (
    <>
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
              <div key={x.uri} className="h-60 w-60 flex-row flex-wrap">
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
    </>
  );
};
