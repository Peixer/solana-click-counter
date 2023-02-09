import type { NextPage } from "next";
import Head from "next/head";
import { CandyView, PackView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Click Counter</title>
        <meta name="description" content="Solana Scaffold" />
      </Head>
      <PackView />
    </div>
  );
};

export default Home;
