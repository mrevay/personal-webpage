import Head from 'next/head';
import Link from 'next/link';

import Background from '@/components/background';
import styles from '@/styles/Home.module.css';

export default function Home() {
  // Pull out icons and construct links for footer
  return (
    <div className={styles.body}>
      <Head>
        <title>Max Revay&apos;s Homepage</title>
        <meta
          name="Homepage"
          content="A landing page containing various links to my online profiles."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Background />

      <div className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}> Hi, I&apos;m Max!</h1>
          <div className={styles.expand}>EXPAND</div>
          <p>
            Welcome to my webpage (best viewed on desktop). I&apos;m a research
            engineer and mathematician working in machine learning, control
            theory and numerical optimization. I&apos;ve just finished my Ph.D,
            at the university of Sydney with Prof. Ian Manchester.
            <br />
            <br />I have also just finished a post-doc at the University of New
            South Wales School of Electrical Engineering developing time series
            clustering algorithms.
            <br></br>
            You might be interested in some of the following links:
          </p>
          <ul>
            <li>
              {` `}
              <Link href="https://scholar.google.com.au/citations?user=zwHd_DYAAAAJ&hl=en&oi=ao">
                <a>Publications</a>
              </Link>
            </li>

            <li>
              {` `}
              <Link href="https://www.linkedin.com/in/max-revay-705542230/?originalSubdomain=au">
                <a>Linked-In</a>
              </Link>
            </li>
            <li>
              {` `}
              <Link href="https://cloudstor.aarnet.edu.au/plus/s/ZIA177r81gKr2M3">
                <a>Thesis</a>
              </Link>
            </li>

            <li>
              {` `}
              <Link href="https://github.com/mrevay">
                <a>Github</a>
              </Link>
            </li>
          </ul>
          Currently, I am working as a guidance and control engineer at Emesent - building one of the world's most advanced drone autonomy solutions.
          I'm always interested in hearing about cool projects, so if you have one, please email
          me at <a href="mailto: maxrevay@gmail.com">maxrevay@gmail.com.</a>
          <br></br>
        </div>
      </div>
      <div className={styles.bottomLeft}>
        <div>
          <kbd>Q</kbd> : increase altitude
        </div>
        <div>
          <kbd>A</kbd> : decrease altitude
        </div>
      </div>

      <div className={styles.topRight}>
        <button className={styles.infoButton}>?</button>
        <div className={styles.popup}>
          What is this page? This page features a physics simulator and a
          control system for a quadcopter that I wrote to run in the browser.
          {` `}
          <br />
          The drone uses an LQR controller and is rendered using THREE.JS.
        </div>
      </div>
    </div>
  );
}
