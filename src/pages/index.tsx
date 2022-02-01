import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import Background from '@/components/background';
import styles from '@/styles/Home.module.css';
import data from '../../data.json';
import { GitHub } from '@mui/icons-material';

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
        <title>Max Revay&apos;s Homepage</title>
        <meta
          name="Homepage"
          content="A landing page containing various links to my online profiles."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Background />
      {/* <header className={styles.header}>
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
          </>
        }
      </header> */}
      <h1 className={styles.title}> Hi, I&apos;m Max! </h1>

      <div className={styles.description}>
        <p>
          I&apos;m a research engineer and mathematician working in machine
          learning, control theory and numerical optimization. I&apos;ve just
          finished my Ph.D, at the university of Sydney with Prof. Ian
          Manchester. Check out my thesis:{` `}
          <Link href="https://cloudstor.aarnet.edu.au/plus/s/ZIA177r81gKr2M3">
            <a>A Behavioral Approach to Robust Machine Learning.</a>
          </Link>
          <br />
          <br />I am currently working as a research associate at the University
          of New South Wales on time series clustering.
        </p>
        {/* <footer className={styles.footer}>{links}</footer> */}
        <footer>
          <Image
            src="/images/scholar96.png"
            width="64"
            height="64"
            alt="Google Scholar"
          ></Image>
          <Image
            src="/images/github.png"
            width="64"
            height="64"
            alt="GitHub"
          ></Image>
          <Image
            src="/images/linked-in.png"
            width="64"
            height="64"
            alt="Google Scholar"
          ></Image>
          <Image
            src="/images/gmail.png"
            width="64"
            height="64"
            alt="Google Scholar"
          ></Image>
        </footer>
      </div>
    </div>
  );
}
