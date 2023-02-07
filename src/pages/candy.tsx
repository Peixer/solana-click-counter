import type { NextPage } from "next";
import Head from "next/head";
import { CandyView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Click Counter</title>
        <meta name="description" content="Solana Scaffold" />
      </Head>
      <CandyView />
    </div>
  );
};

export default Home;
