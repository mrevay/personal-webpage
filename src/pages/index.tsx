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
            I&apos;m a research engineer and mathematician working in machine
            learning, control theory and numerical optimization. I&apos;ve just
            finished my Ph.D, at the university of Sydney with Prof. Ian
            Manchester.
            <br />
            <br />I am currently working as a research associate at the
            University of New South Wales on time series clustering.
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
          Email:maxrevay@gmail.com.
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
          The drone uses an
          <Link href="https://en.wikipedia.org/wiki/Linear%E2%80%93quadratic_regulator">
            <a> LQR controller </a>
          </Link>
          and is rendered using{` `}
          <Link href="https://threejs.org/">
            <a> THREE.JS</a>
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
