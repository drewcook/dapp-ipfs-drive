import React, { useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileIcon, defaultStyles } from 'react-file-icon'
import { Table } from 'reactstrap'
import IPFSDriveContract from './contracts/IPFSDrive.json'
import getWeb3 from './getWeb3'
import ipfsClient from './ipfsClient'
import { format } from 'date-fns'

const baseStyle = {
	flex: 1,
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	padding: '20px',
	borderWidth: 2,
	borderRadius: 2,
	borderColor: '#eeeeee',
	borderStyle: 'dashed',
	backgroundColor: '#fafafa',
	color: '#bdbdbd',
	outline: 'none',
	transition: 'border .24s ease-in-out',
}

const focusedStyle = {
	borderColor: '#2196f3',
}

const acceptStyle = {
	borderColor: '#00e676',
}

const rejectStyle = {
	borderColor: '#ff1744',
}

const App = () => {
	const [web3, setWeb3] = useState(null)
	const [userAccount, setUserAccount] = useState(null)
	const [contract, setContract] = useState(null)
	const [drive, setDrive] = useState([])
	const [ipfs, setIpfs] = useState(null)

	useEffect(() => {
		const init = async () => {
			try {
				// Get network provider and web3 instance.
				const web3 = await getWeb3()

				// Use web3 to get the user's accounts.
				const [initialAccount] = await web3.eth.getAccounts()

				// Get the contract instance.
				const networkId = await web3.eth.net.getId()
				const deployedNetwork = IPFSDriveContract.networks[networkId]
				const instance = new web3.eth.Contract(
					IPFSDriveContract.abi,
					deployedNetwork && deployedNetwork.address,
				)

				// Set local state
				setWeb3(web3)
				setUserAccount(initialAccount)
				setContract(instance)

				// Connect to IPFS
				await connectIpfsDaemon()

				// Get files initially
				await getFiles(instance, initialAccount)

				// Listen for account changes
				web3.currentProvider.on('accountsChanged', async ([newAccount]) => {
					console.info('Switching wallet accounts')
					setUserAccount(newAccount)
					await getFiles(instance, newAccount)
				})

				// Listen for chain changes
				web3.currentProvider.on('chainChanged', async chainId => {
					console.info(`Switching wallet networks: Network ID ${chainId} is supported`)
					const deployedNetwork = IPFSDriveContract.networks[chainId]
					const instance = new web3.eth.Contract(
						IPFSDriveContract.abi,
						deployedNetwork && deployedNetwork.address,
					)
					await getFiles(instance, userAccount)
				})
			} catch (err) {
				// Catch any errors for any of the above operations.
				alert(`Failed to load web3, accounts, or contract. Check console for details.`)
				console.error(err)
			}
		}
		init()
		/* eslint-disable-next-line react-hooks/exhaustive-deps */
	}, [])

	/**
	 * Connect to IPFS Node
	 */
	const connectIpfsDaemon = async () => {
		try {
			const node = ipfsClient
			const isOnline = node.isOnline()

			if (isOnline) {
				setIpfs(node)
			}
		} catch (err) {
			console.error(err)
		}
	}

	/**
	 * Gets files from smart contract
	 * @param {IPFSDrive} contract - The IPFSDrive smart contract instance
	 * @param {string} userAccount - The current connect account address
	 */
	const getFiles = async (contract, userAccount) => {
		if (!contract) return
		try {
			const filesLen = await contract.methods.getLength().call({ from: userAccount })
			const files = []
			let file
			for (let i = 0; i < filesLen; i++) {
				file = await contract.methods.getFile(i).call({ from: userAccount })
				files.push(file)
			}
			setDrive(files)
		} catch (err) {
			console.error(err)
		}
	}

	// Dropzone
	const {
		getRootProps,
		getInputProps,
		isFocused,
		isDragActive,
		isDragAccept,
		isDragReject,
	} = useDropzone({
		onDrop: async ([file]) => {
			// Add file to IPFS and wrap it in a directory to keep the original filename
			const fileDetails = {
				path: file.name,
				content: file,
			}

			const options = {
				wrapWithDirectory: true,
				progress: prog => console.info(`Polling: ${prog}`),
			}

			try {
				// Add file to IPFS
				const addedFile = await ipfs.add(fileDetails, options)

				// Add file to smart contract
				const hash = addedFile.cid.toString()
				const filename = file.name
				const filetype = file.name.substr(file.name.lastIndexOf('.') + 1)
				const timestamp = Math.round(+new Date() / 1000)

				await contract.methods
					.add(hash, filename, filetype, timestamp)
					.send({ from: userAccount, gas: 300000 })

				// Get files after upload
				getFiles(contract, userAccount)
				alert('File(s) successfully uploaded to IPFS.')
			} catch (err) {
				console.error(err)
			}
		},
		// Accept all file types
	})
	const dropzoneStyles = useMemo(
		() => ({
			...baseStyle,
			...(isFocused ? focusedStyle : {}),
			...(isDragAccept ? acceptStyle : {}),
			...(isDragReject ? rejectStyle : {}),
			padding: '50px 20px',
		}),
		[isFocused, isDragAccept, isDragReject],
	)

	const renderFiles = () => {
		return drive.length > 0 ? (
			drive.map((file, idx) => {
				const { 0: hash, 1: filename, 2: filetype, 3: timestamp } = file
				return (
					<tr key={`${idx}-${hash}`}>
						<td>
							<div className="w-75 m-auto">
								<FileIcon extension={filetype} {...defaultStyles[filetype]} />
							</div>
						</td>
						<td className="text-start">
							<a href={`https://ipfs.io/ipfs/${hash}`}>{filename}</a>
						</td>
						<td className="text-end">{format(new Date(timestamp * 1000), 'M/dd/yyyy h:mm a')}</td>
					</tr>
				)
			})
		) : (
			<tr>
				<td colSpan={3}>
					<small>
						<em>Your drive is currently empty. Get started by uploading your first file.</em>
					</small>
				</td>
			</tr>
		)
	}

	if (!web3) return <div>Loading Web3, accounts, and contract...</div>

	return (
		<div className="text-center">
			<div className="container pt-5">
				<h1 className="mb-4">IPFS Drive</h1>
				<p className="lead">Upload your files to IPFS. Click on each file to view them.</p>
				<div {...getRootProps({ style: dropzoneStyles })} className="mb-5">
					<input {...getInputProps()} />
					{isDragActive
						? 'Drop the files here ...'
						: "Drag 'n' drop some files here, or click to select files"}
				</div>
				<Table>
					<thead>
						<tr>
							<th width="7%" scope="row">
								Type
							</th>
							<th className="text-start">File Name</th>
							<th className="text-end">Date</th>
						</tr>
					</thead>
					<tbody>{renderFiles()}</tbody>
				</Table>
				<p className="copy">
					<small>
						&copy;2022 <a href="https://dco.dev">dco.dev</a>
						&nbsp;| All Rights Reserved
					</small>
				</p>
			</div>
		</div>
	)
}

export default App
