import { create } from 'ipfs-http-client'

const projectId = process.env.REACT_APP_INFURA_IPFS_PROJECT_ID
const projectSecret = process.env.REACT_APP_INFURA_IPFS_PROJECT_SECRET
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')

const localNode = {
	host: 'localhost',
	port: 5001,
	protocol: 'http',
}

const infuraNode = {
	host: 'ipfs.infura.io',
	port: 5001,
	protocol: 'https',
	headers: {
		authorization: auth,
	},
}

const config = process.env.NODE_ENV === 'production' ? infuraNode : localNode

const ipfsClient = create(config)

export default ipfsClient
