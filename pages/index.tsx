import detectEthereumProvider from "@metamask/detect-provider"
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof, packToSolidityProof } from "@semaphore-protocol/proof"
import { providers } from "ethers"
import Head from "next/head"
import React from "react"
import styles from "../styles/Home.module.css"

export default function Home() {
    const [logs, setLogs] = React.useState("Connect your wallet and greet!")
    const [identity, setIdentity] = React.useState(0n);
    async function createProof() {
        setLogs("Creating your Semaphore identity...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()
        const message = await signer.signMessage("Mix your token here!")

        const identity = new Identity(message)
        const idCommit=identity.generateCommitment()
        setIdentity(idCommit)

        
        setLogs(`Creating your Semaphore proof... for ID ${idCommit}`)

        const greeting = "Hello Mulitchain"
        console.log(Object.keys(identity))
        let group= new Group()
        //let commits=await target.groupCommitments(1)
        //setIdentity()
        //group.addMembers(commits)
        try{
            const { proof, publicSignals } = await generateProof(identity, group, greeting, greeting, {
                wasmFilePath: "./semaphore.wasm",
                zkeyFilePath: "./semaphore.zkey"
            })
            const solidityProof = packToSolidityProof(proof)
            console.log(proof)
            console.log(Object.keys(solidityProof))
        }catch(e){
            console.log(e)
        }
       

      
    }
    async function generateId(){
        setLogs("Creating your Semaphore identity...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()
        const message = await signer.signMessage("Mix your token here!")

        const identity = new Identity(message)
        const idCommit=identity.generateCommitment()
        setIdentity(idCommit)

        
        setLogs(`Your ZK commitment is ${idCommit}`)
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Greetings</title>
                <meta name="description" content="A simple Next.js/Hardhat privacy application with Semaphore." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>Greetings</h1>

                <p className={styles.description}>A simple Next.js/Hardhat privacy application with Semaphore.</p>

                <div className={styles.logs}>{logs}</div>
                <p>{identity}</p>
                <div onClick={() => generateId()} className={styles.button}>
                    Create ZK Commit
                </div>
            </main>
        </div>
    )
}
