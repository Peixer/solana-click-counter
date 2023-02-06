import type { NextPage } from "next";
import Head from "next/head";
import { HomeView, MarketplaceView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Click Counter</title>
        <meta name="description" content="Solana Scaffold" />
      </Head>
      <MarketplaceView />
    </div>
  );
};

export default Home;
