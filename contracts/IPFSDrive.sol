// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <8.10.0;

contract IPFSDrive {
    struct File {
        string hash;
        string filename;
        string filetype;
        uint256 date;
    }

    mapping(address => File[]) files;

    function add(
        string memory _hash,
        string memory _filename,
        string memory _filetype,
        uint256 _date
    ) public {
        files[msg.sender].push(File(_hash, _filename, _filetype, _date));
    }

    function getFile(uint256 _index)
        public
        view
        returns (
            // File
            string memory,
            string memory,
            string memory,
            uint256
        )
    {
        File memory file = files[msg.sender][_index];
        return (file.hash, file.filename, file.filetype, file.date);
    }

    function getLength() public view returns (uint256) {
        return files[msg.sender].length;
    }
}
