import { PixelAddress, PixelABI, PinataApiKey, PinataApiSecret } from "./data.js";

(function() {
  let loginAddress = localStorage.getItem("loginAddress");
  let imagePath;
  let blockSize = 0;
  const TargetChain = {
    id: "80001",
    name: "mumbai"
  };
  const palette = "[0,0,0]";
  const baseUrl = "https://gateway.pinata.cloud/ipfs/";

  const provider = new ethers.providers.Web3Provider(web3.currentProvider);
  const signer = provider.getSigner();
  const PixelContract = new ethers.Contract(PixelAddress, PixelABI, provider);

  function fetchErrMsg (err) {
    const errMsg = err.error ? err.error.message : err.message;
    alert('Error:  ' + errMsg.split(": ")[1]);
    $("#loading").hide();
  }

  async function checkChainId () {
    const { chainId } = await provider.getNetwork();
    if (chainId != parseInt(TargetChain.id)) {
      alert("We don't support this chain, please switch to " + TargetChain.name + " and refresh");
      return;
    }
  }

  const toggleAddress = function() {
    if(loginAddress) {
        $("#login_address").text(loginAddress).show();
        $("#loginBtn").hide();
    } else {
        $("#loginBtn").show();
        $("#login_address").hide();
    }
}

  // Check if user is logged in
  const checkLogin = async function() {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts.length > 0) {
        localStorage.setItem("loginAddress", accounts[0]);
        loginAddress = accounts[0];
    } else {
        localStorage.removeItem("loginAddress");
        loginAddress = null;
    }
    toggleAddress();
  }

  const uploadImg = async function() {
    const c = $("#pixelitcanvas")[0];
    const newImg = c.toDataURL('image/png');
    const res = await fetch(newImg);
    const blob = await res.blob();
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

    const data = new FormData();
    data.append('file', blob);

    const metadata = JSON.stringify({
      name: 'testname',
    });
    data.append('pinataMetadata', metadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    data.append('pinataOptions', pinataOptions);

    return axios
      .post(url, data, {
        headers: {
          // @ts-ignore
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          pinata_api_key: PinataApiKey,
          pinata_secret_api_key: PinataApiSecret,
        },
      })
      .then((response) => {
        imagePath = `${baseUrl}${response.data.IpfsHash}`;
        mint();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const mint = async function() {
    try {
      const pixelWithSigner = PixelContract.connect(signer);
      const tx = await pixelWithSigner.mint(imagePath, blockSize.toString(), palette);
      console.log("sending tx, ", tx);
      await tx.wait();
      console.log("received tx ", tx);
      alert("Successfully minted!");
      location.reload();
    } catch (err) {
      fetchErrMsg(err);
      location.reload();
    }
  }

  if (window.ethereum) {
    checkChainId();
    toggleAddress();
    $("#loading").hide();
    $(".pixelImg").remove();
    $(".selectedBlock").hide();

    $("#loginBtn").on("click", function() {
      checkLogin();
    })

    $("#uploadBtn").on("click", function() {
      $("#pixlInput").click();
    })

    $("#pixlInput").on("change", function() {
      $(".pixelImg").remove();
      $(".selectedBlock").hide();
      let img = new Image()
      const c = $("#pixelitcanvas")[0];
      const ctx = c.getContext('2d');

      img.onload = function () {
        const w = img.width;
        const h = img.height;
        c.width = w;
        c.height = h;
        ctx.drawImage(img, 0, 0);

        let pixelArr = ctx.getImageData(0, 0, w, h).data;

        for (let z = 1; z < 4; z++) {
          let size = 20 * z * 0.2;
          for (let y = 0; y < h; y += size) {
            for (let x = 0; x < w; x += size) {
              let p = (x + (y*w)) * 4;
              ctx.fillStyle = "rgba(" + pixelArr[p] + "," + pixelArr[p + 1] + "," + pixelArr[p + 2] + "," + pixelArr[p + 3] + ")";
              ctx.fillRect(x, y, size, size);
            }
          }

          $("#pixelImgs").append(`<div class="pixelImg" data-size="${size}"><img src="${c.toDataURL('image/png')}" width="200" /></div>`);
        }

        c.style.visibility = "hidden";
        c.style.height = 0;

      };

      img.src = URL.createObjectURL($(this).prop("files")[0]);
    })

    $("#root").on("click", ".pixelImg", function() {
      blockSize = $(this).data("size");
      $(".selectedBlock").show();
      $("#selectedImg").attr("src", $(this).find("img").attr("src"));
    })

    $("#mintBtn").on("click", function() {
      if(blockSize == 0){
        alert("You need select a pixel size first!");
      } else {
        $("#loading").show();
        uploadImg();
      }
    })

    // detect Metamask account change
    ethereum.on('accountsChanged', function (accounts) {
      console.log('accountsChanges',accounts);
      if (accounts.length > 0) {
        localStorage.setItem("loginAddress", accounts[0]);
        loginAddress = accounts[0];
      } else {
        localStorage.removeItem("loginAddress");
        loginAddress = null;
      }
      toggleAddress();
    });

    // detect Network account change
    ethereum.on('chainChanged', function(networkId){
      console.log('networkChanged',networkId);
      if (networkId != parseInt(TargetChain.id)) {
        alert("We don't support this chain, please switch to " + TargetChain.name + " and refresh");
      }
    });
  } else {
    console.warn("No web3 detected.");
  }

})();