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

export const CandyView: FC = ({}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { getUserSOLBalance } = useUserSOLBalanceStore();
  const mx = Metaplex.make(connection);
  const [candyMachineAddress, setCandyMachineAddress] = useLocalStorage(
    "candyMachine",
    `GszFrxuSY5KjWkKEpqsVG58ysb2EBLqc6RAeNhM7zWwY`
  );
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58());
      getUserSOLBalance(wallet.publicKey, connection);
    }
  }, [wallet.publicKey, connection, getUserSOLBalance]);

  const uploadCollectionFile = async () => {
    mx.use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    ).use(walletAdapterIdentity(wallet));
    const bundlrStorageDriver = mx.storage().driver() as BundlrStorageDriver;
    await (await bundlrStorageDriver.bundlr()).fund(1000);

    const maxQuantity = 2;
    const uris = [];
    const items: CandyMachineV2Item[] = [];
    try {
      for (let index = 0; index < maxQuantity; index++) {
        const { uri, metadata } = await uploadFile(index);
        uris.push(uri);
        items.push({ name: metadata.name, uri: uri });
      }
      const { uri, metadata } = await mx.nfts().uploadMetadata({
        name: "Numbers Collection",
        symbol: "NB",
        description: "Collection of 10 numbers on the blockchain.",
        image: "collection.png",
        attributes: [],
        properties: {
          files: [
            {
              uri: "collection.png",
              type: "image/png",
            },
          ],
        },
      });

      const { nft: collectionNft } = await mx.nfts().create({
        name: "Numbers Collection",
        uri: uri,
        sellerFeeBasisPoints: 0,
        isCollection: true,
      });

      const allowList = [
        "Eg3QSugvVetekSf3N2suRkjLokChjxo5BuVg3jcLfHhV",
        "23Y1se6WSaTaguTTAgzFK83DKWZCpfPHBjScEyt13D8t",
        "BFGtEqbsb7NEscE9o9ewhwLjJgAnycN9C9E6S7GudFbT",
      ];

      const candyMachine = await mx.candyMachines().create({
        symbol: "MYPROJECT",
        itemsAvailable: toBigNumber(maxQuantity),
        sellerFeeBasisPoints: 0,
        isMutable: true,
        creators: [{ address: mx.identity().publicKey, share: 100 }],
        collection: {
          address: collectionNft.address,
          updateAuthority: mx.identity(),
        },
        // itemSettings: {
        //   type: "hidden",
        //   name: "My NFT Project #$ID+1$",
        //   uri: "https://arweave.net/9kb6YluZhEYq2gmEBe0VCJIJkvI20TphuytaSh1EVs8",
        //   // THE FILE WITH ALL OFFICIAL URI THAT WILL BE USED IN THE FUTURE
        //   hash: md5(
        //     "https://arweave.net/9kb6YluZhEYq2gmEBe0VCJIJkvI20TphuytaSh1EVs8"
        //   ),
        // },
        guards: {
          // ALLOW LIST
          // allowList: {
          //   merkleRoot: getMerkleRoot(allowList),
          // },
          solPayment: {
            amount: sol(0.5),
            destination: mx.identity().publicKey,
          },
          // mintLimit: {
          //   id: 1,
          //   limit: 1,
          // },
        },
      });

      // It must be commented for HIDDEN settings/ blind drop
      const insertItems = await mx.candyMachines().insertItems({
        candyMachine: candyMachine.candyMachine,
        items: items,
      });

      setItems(items);
      setCandyMachineAddress(candyMachine.candyMachine.address.toString());
    } catch (error) {
      console.log("error", error);
    }
  };

  const uploadFile = async (index): Promise<UploadMetadataOutput> => {
    const fileUri = await fetch(`assets/${index}.png`).then(
      async (response) => {
        const blobR = await response.blob();
        const file = new File([blobR], `assets/${index}.png`);
        const metaplexFile = await toMetaplexFileFromBrowser(file);
        return await mx.storage().upload(metaplexFile);
      }
    );

    return mx.nfts().uploadMetadata({
      symbol: "NB",
      name: `Number #000${index}`,
      description: `Collection of 10 numbers on the blockchain. This is the number ${index}/10.`,
      image: fileUri,
      attributes: [
        {
          trait_type: "Number",
          value: index.toString(),
        },
      ],
      properties: {
        files: [
          {
            type: "image/png",
            uri: fileUri,
          },
        ],
      },
    });
  };

  const mintNow = async () => {
    mx.use(walletAdapterIdentity(wallet));
    const candyMachine = await mx.candyMachines().findByAddress({
      address: new PublicKey(candyMachineAddress),
    });

    const allowList = [
      "Eg3QSugvVetekSf3N2suRkjLokChjxo5BuVg3jcLfHhV",
      "23Y1se6WSaTaguTTAgzFK83DKWZCpfPHBjScEyt13D8t",
      "BFGtEqbsb7NEscE9o9ewhwLjJgAnycN9C9E6S7GudFbT",
    ];

    const mintingWallet = mx.identity().publicKey.toBase58();

    // ALLOW LIST
    // await mx.candyMachines().callGuardRoute({
    //   candyMachine,
    //   guard: "allowList",
    //   settings: {
    //     path: "proof",
    //     merkleProof: getMerkleProof(allowList, mintingWallet),
    //   },
    // });

    await mx.candyMachines().mint({
      candyMachine,
      collectionUpdateAuthority: candyMachine.authorityAddress,
    });
  };

  const revealNFT = async () => {
    mx.use(walletAdapterIdentity(wallet));
    const candyMachine = await mx.candyMachines().findByAddress({
      address: new PublicKey(candyMachineAddress),
    });

    // This should be done for all NFT Minted
    const nft = await mx.nfts().findByToken({token: new PublicKey(`GWG5sZwZvesHKm1ui1ba5JyvkaNEd5F1swoqT6Gbj5H`)})
    await mx.nfts().update({
      nftOrSft: nft,
      name: `REVELEAD - My NFT Project`,
      uri: `https://arweave.net/Jfl5PEhx7X9ck-8CXbbtlrJtSuRcH3EUtZrF5n-6xiI`
    });
  };

  const updateCandy = async () => {
    mx.use(walletAdapterIdentity(wallet));
    const candyMachine = await mx.candyMachines().findByAddress({
      address: new PublicKey(candyMachineAddress),
    });

    await mx.candyMachines().update({
      candyMachine,
      guards: {
        startDate: {
          date: toDateTime(new Date()),
        },
      },
    });
  };

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className="mt-6">
          <div className="text-sm font-normal align-bottom text-right text-slate-600 mt-4">
            v{pkg.version}
          </div>
          <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            Solana Candy Machine
          </h1>
        </div>

        <div>
          <button
            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black  grid w-full"
            onClick={uploadCollectionFile}
          >
            <span>NEW CANDY MACHINE</span>
          </button>
          <button
            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black  grid w-full"
            onClick={mintNow}
          >
            <span>MINT NOW</span>
          </button>
          <button
            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black  grid w-full"
            onClick={updateCandy}
          >
            <span>LIVE ON</span>
          </button>
          <button
            className="px-8 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black  grid w-full"
            onClick={revealNFT}
          >
            <span>REVEAL NFT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

