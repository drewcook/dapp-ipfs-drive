import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileIcon, defaultStyles } from 'react-file-icon'
import { Table } from 'reactstrap'
import './App.css'
import IPFSDriveContract from './contracts/IPFSDrive.json'
import getWeb3 from './getWeb3'
import ipfsClient from './ipfsClient'
import { format } from 'date-fns'
import pull from 'pull-stream'
import fileReader from 'pull-file-reader'

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
	const [accounts, setAccounts] = useState(null)
	const [contract, setContract] = useState(null)
	const [drive, setDrive] = useState([])

	useEffect(async () => {
		try {
			// Get network provider and web3 instance.
			const web3 = await getWeb3()

			// Use web3 to get the user's accounts.
			const accounts = await web3.eth.getAccounts()

			// Get the contract instance.
			const networkId = await web3.eth.net.getId()
			const deployedNetwork = IPFSDriveContract.networks[networkId]
			const instance = new web3.eth.Contract(
				IPFSDriveContract.abi,
				deployedNetwork && deployedNetwork.address,
			)

			// Set local state
			setWeb3(web3)
			setAccounts(accounts)
			setContract(instance)

			// Get files
			getFiles()
		} catch (error) {
			// Catch any errors for any of the above operations.
			alert(`Failed to load web3, accounts, or contract. Check console for details.`)
			console.error(error)
		}
	}, [])

	// Dropzone
	const onDrop = useCallback(async acceptedFiles => {
		try {
			// TODO: Support multiple with a for...of loop
			const stream = pull(
				fileReader(acceptedFiles[0]),
				pull.collect((err, buffers) => {
					let contents = Buffer.concat(buffers)
					console.log(contents)
				}),
			)
			ipfsClient.pin.add(stream).then(res => {
				console.log(res)
			})
			debugger
		} catch (err) {
			console.error(err)
		}
	}, [])

	const {
		getRootProps,
		getInputProps,
		isFocused,
		isDragActive,
		isDragAccept,
		isDragReject,
	} = useDropzone({
		onDrop,
		// Accept all file types
	})

	const style = useMemo(
		() => ({
			...baseStyle,
			...(isFocused ? focusedStyle : {}),
			...(isDragAccept ? acceptStyle : {}),
			...(isDragReject ? rejectStyle : {}),
		}),
		[isFocused, isDragAccept, isDragReject],
	)

	const getFiles = async () => {
		if (!contract) return
		try {
			const filesLen = await contract.methods.getLength().call()
			const files = []
			let file
			for (let i = 0; i < filesLen; i++) {
				file = await contract.methods.getFile(i).call()
				files.push(file)
			}
			setDrive(files)
			console.log(filesLen)
		} catch (err) {
			console.error(err)
		}
	}

	if (!web3) return <div>Loading Web3, accounts, and contract...</div>

	return (
		<div className="App">
			<div className="container pt-5">
				<h1 className="mb-4">IPFS Drive</h1>
				<div {...getRootProps({ style })} className="mb-5">
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
					<tbody>
						<tr>
							<th>
								<div className="w-50 m-auto">
									<FileIcon extension="docx" {...defaultStyles.docx} />
								</div>
							</th>
							<th className="text-start">myFile.docx</th>
							<th className="text-end">{format(Date.now(), 'M/dd/yyyy')}</th>
						</tr>
					</tbody>
				</Table>
			</div>
		</div>
	)
}

export default App
