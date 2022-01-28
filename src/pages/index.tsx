import data from '../../data.json';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import styles from '@/styles/Home.module.css';

export default function Home() {
  // Pull out icons and construct links for footer
  const links = data.links.map(({ alt, icon, link }) => {
    const path = `https://unpkg.com/simple-icons@v6/icons/` + icon + `.svg`;
    console.log(path);
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" key={icon}>
        <img height="64" width="64" src={path} alt={alt} />
      </a>
    );
  });

  return (
    <div className={styles.container}>
      <Head>
        <title>Max Revays Homepage</title>
        <meta
          name="Homepage"
          content="A landing page containing various links to my online profiles."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        {
          <>
            <Image
              priority
              src={data.profile}
              className={styles.borderCircle}
              height={200}
              width={200}
              alt={`profile_picture`}
            />
            <h1 className={styles.heading2Xl}>{`Max Revay`}</h1>
          </>
        }
      </header>

      <div className={styles.description}>
        <p>
          {data.bio}
          Check out my thesis:{` `}
          <Link href="https://cloudstor.aarnet.edu.au/plus/s/ZIA177r81gKr2M3">
            <a>A Behavioral Approach to Robust Machine Learning.</a>
          </Link>
        </p>

        <p>
          I am currently working as a research associate at the University of
          New South Wales on time series clustering.
        </p>
        <footer className={styles.footer}>{links}</footer>
      </div>
    </div>
  );
}
