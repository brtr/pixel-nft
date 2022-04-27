pragma solidity ^0.8.0;

import "./ERC721Enumerable.sol";
import "./Strings.sol";
import "./Ownable.sol";


contract PixelNFT is ERC721Enumerable, Ownable {
    //supply counters
    uint64 public totalCount = 10000;
    struct Pixel {
        uint256 blockSize;
        string palette;
        string imagePath;
    }

    mapping (uint256 => Pixel) private _tokenTraits;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        Pixel memory p = _tokenTraits[tokenId];

        string memory metadata = string(abi.encodePacked(
            '{"name": "PixelNFT #',
            Strings.toString(tokenId),
            '", "description": "Upload your avatar and you can get a pixel nft.", "image": "' ,
            p.imagePath,
            '", "attributes":[',
            '{"trait_type":"BlockSize","value":"',
            Strings.toString(p.blockSize),
            '"},{"trait_type":"Palette","value":"',
            p.palette,
            '"}]}'
        ));


        return string(abi.encodePacked(
            "data:application/json;base64,",
            base64(bytes(metadata))
        ));
    }

    function mint(string memory imagePath, uint256 blockSize, string memory palette) public {
        uint256 ts = totalSupply() + 1;
        require(ts <= totalCount, "max supply reached!");

        _tokenTraits[ts] = Pixel(blockSize, palette, imagePath);
        _safeMint(_msgSender(), ts);
    }

    string internal constant TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    function base64(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return '';
        
        // load the table into memory
        string memory table = TABLE;

        // multiply by 4/3 rounded up
        uint256 encodedLen = 4 * ((data.length + 2) / 3);

        // add some extra buffer at the end required for the writing
        string memory result = new string(encodedLen + 32);

        assembly {
        // set the actual output length
        mstore(result, encodedLen)
        
        // prepare the lookup table
        let tablePtr := add(table, 1)
        
        // input ptr
        let dataPtr := data
        let endPtr := add(dataPtr, mload(data))
        
        // result ptr, jump over length
        let resultPtr := add(result, 32)
        
        // run over the input, 3 bytes at a time
        for {} lt(dataPtr, endPtr) {}
        {
            dataPtr := add(dataPtr, 3)
            
            // read 3 bytes
            let input := mload(dataPtr)
            
            // write 4 characters
            mstore(resultPtr, shl(248, mload(add(tablePtr, and(shr(18, input), 0x3F)))))
            resultPtr := add(resultPtr, 1)
            mstore(resultPtr, shl(248, mload(add(tablePtr, and(shr(12, input), 0x3F)))))
            resultPtr := add(resultPtr, 1)
            mstore(resultPtr, shl(248, mload(add(tablePtr, and(shr( 6, input), 0x3F)))))
            resultPtr := add(resultPtr, 1)
            mstore(resultPtr, shl(248, mload(add(tablePtr, and(        input,  0x3F)))))
            resultPtr := add(resultPtr, 1)
        }
        
        // padding with '='
        switch mod(mload(data), 3)
        case 1 { mstore(sub(resultPtr, 2), shl(240, 0x3d3d)) }
        case 2 { mstore(sub(resultPtr, 1), shl(248, 0x3d)) }
        }
        
        return result;
    }
}