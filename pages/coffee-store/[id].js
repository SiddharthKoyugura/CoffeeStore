/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import styles from "../../styles/coffee-store.module.css";
import Image from "next/image";
import cls from "classnames";
import { fetchCoffeeStores } from "@/lib/coffee-stores";
import { StoreContext } from "@/contex/store-context";
import { isEmpty, fetcher } from "@/utils";
import useSWR from "swr";

export async function getStaticProps(staticProps) {
  const params = staticProps.params;
  const coffeeStores = await fetchCoffeeStores();
  const findCoffeeStoresById = coffeeStores.find((coffeeStore) => {
    return coffeeStore.id.toString() === params.id;
  });

  return {
    props: {
      coffeeStore: findCoffeeStoresById || {},
    },
  };
}

export async function getStaticPaths() {
  const coffeeStores = await fetchCoffeeStores();
  const paths = coffeeStores.map((coffeeStore) => {
    return {
      params: {
        id: coffeeStore.id.toString(),
      },
    };
  });
  return {
    paths,
    fallback: true,
  };
}

const CoffeeStore = (initialProps) => {
  const router = useRouter();
  // console.log(router);

  if (router.isFallback) {
    return <div>Loading....</div>;
  }

  const id = router.query.id;

  const [coffeeStore, setCoffeeStore] = useState(initialProps.coffeeStore);
  const {
    state: { coffeeStores },
  } = useContext(StoreContext);

  const handleCreateCoffeeStore = async (coffeeStore) => {
    try {
      const { id, name, address, neighbourhood, voting, imgUrl } = coffeeStore;

      const response = await fetch("/api/createCoffeeStore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          name,
          address: address || "",
          neighbourhood: neighbourhood || "",
          voting: 0,
          imgUrl,
        }),
      });

      // const dbCoffeeStores = response.json();
      // console.log({dbCoffeeStores});
    } catch (err) {
      console.error("Error creating coffee store", err);
    }
  };

  useEffect(() => {
    if (isEmpty(coffeeStore)) {
      if (coffeeStores.length > 0) {
        const coffeeStoreFromContext = coffeeStores.find((coffeeStore) => {
          return coffeeStore.id.toString() === id;
        });
        if (coffeeStoreFromContext) {
          setCoffeeStore(coffeeStoreFromContext);
          handleCreateCoffeeStore(coffeeStoreFromContext);
        }
      }
    } else{
      handleCreateCoffeeStore(coffeeStore);
    }
  }, [id, initialProps.coffeeStore]);
  const { address, name, imgUrl, neighbourhood } = coffeeStore;

  const [votingCount, setVotingCount] = useState(0);

  const { data, error } = useSWR(`/api/getCoffeeStoreById?id=${id}`, fetcher, { refreshInterval: 1 });

  useEffect(() => {
    if (data && data.length > 0) {
      setCoffeeStore(data[0]);
      setVotingCount(data[0].voting);
    }
  }, [data]);

  const handleUpvoteButton = async () => {
    try {
      const response = await fetch("/api/favouriteCoffeeStoreById", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
        }),
      });

      const dbCoffeeStores = response.json();
      if(dbCoffeeStores && dbCoffeeStores.length>0){
        setVotingCount(votingCount+1);
      }
    } catch (err) {
      console.error("Error updating the upvote", err);
    }
  };

  if (error) {
    console.log("SWR error", error);
    return <div>Something went wrong while retrieving data</div>;
  }

  return (
    <div className={styles.layout}>
      <Head>
        <title>{name}</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.col1}>
          <div className={styles.backToHomeLink}>
            <Link href="/">← Back to Home</Link>
          </div>
          <div className={styles.nameWrapper}>
            <h1 className={styles.name}>{name}</h1>
          </div>
          <Image
            src={
              imgUrl ||
              "https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
            }
            width={600}
            height={360}
            className={styles.storeImg}
            alt={name}
          />
        </div>
        <div className={cls("glass", styles.col2)}>
          {address && (
            <div className={styles.iconWrapper}>
              <Image
                src="/static/icons/places.svg"
                height={24}
                width={24}
                alt=""
              />
              <p className={styles.text}>{address}</p>
            </div>
          )}
          {neighbourhood && (
            <div className={styles.iconWrapper}>
              <Image
                src="/static/icons/nearMe.svg"
                height={24}
                width={24}
                alt=""
              />
              <p className={styles.text}>{neighbourhood}</p>
            </div>
          )}
          <div className={styles.iconWrapper}>
            <Image src="/static/icons/star.svg" height={24} width={24} alt="" />
            <p className={styles.text}>{votingCount}</p>
          </div>

          <button className={styles.upvoteButton} onClick={handleUpvoteButton}>
            Up Vote
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoffeeStore;
