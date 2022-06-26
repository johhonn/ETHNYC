import detectEthereumProvider from "@metamask/detect-provider"
import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof, packToSolidityProof } from "@semaphore-protocol/proof"
import { providers,Contract,getDefaultProvider } from "ethers"
import {abi as targetABI}  from "../artifacts/contracts/target.sol/Target.json"
import {abi as sourceABI} from "../artifacts/contracts/source.sol/Source.json"

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
        const sourceProvider = getDefaultProvider("goerli")
        const signer = ethersProvider.getSigner()
        const TargetContract=new Contract('0xb92A09E8c3194a72b079E502129D02fb5a3f35B6',targetABI,signer)
        //0xB17Be17999ED91C8829554CBb1C1CcB1c8CD813
        const SourceContract=new Contract('0xB17Be17999ED91C8829554CBb1C1CcB1c8CD813',sourceABI,signer)
        const message = await signer.signMessage("Mix your token here!")

        const identity = new Identity(message)
        const idCommit=identity.generateCommitment()
        setIdentity(idCommit)

        
        setLogs(`Creating your Semaphore proof... for ID ${idCommit}`)

        const greeting = "Hello Mulitchain"
        console.log(Object.keys(identity))
        let group= new Group()
        let commits=await TargetContract.groupCommitments(1)
        //setIdentity()
        group.addMembers(commits)
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
        return idCommit
    }
    async function addID(){
        setLogs("Creating your Semaphore identity...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const sourceProvider = getDefaultProvider("goerli")
        const signer = ethersProvider.getSigner()
        const TargetContract=new Contract('0xb92A09E8c3194a72b079E502129D02fb5a3f35B6',targetABI,signer)
        //0xB17Be17999ED91C8829554CBb1C1CcB1c8CD813
        const SourceContract=new Contract('0xB17Be17999ED91C8829554CBb1C1CcB1c8CD813',sourceABI,signer)
        const message = await signer.signMessage("Mix your token here!")

        const identity = new Identity(message)
        const idCommit=identity.generateCommitment()
        setIdentity(idCommit)
        let r=await TargetContract.addTestCommitment(idCommit)
        console.log(await r.wait())
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
                <div onClick={() => addID()} className={styles.button}>
                    Create ZK Commit
                </div>
            </main>
        </div>
    )
}
