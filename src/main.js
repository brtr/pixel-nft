import { PixelAddress, PixelABI, PinataApiKey, PinataApiSecret, PaletteList } from "./data.js";

(function() {
  let loginAddress = localStorage.getItem("loginAddress");
  let imagePath;
  let blockSize = 0;
  let palette = 0;
  const TargetChain = {
    id: "80001",
    name: "mumbai"
  };
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

  const toggleAddress = () => {
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
      const tx = await pixelWithSigner.mint(imagePath, blockSize.toString(), PaletteList[palette].toString());
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

  const colorSim = function(rgbColor, compareColor) {
    let i;
    let max;
    let d = 0;
    for (i = 0, max = rgbColor.length; i < max; i++) {
      d += (rgbColor[i] - compareColor[i]) * (rgbColor[i] - compareColor[i]);
    }
    return Math.sqrt(d);
  }

  const similarColor = function(actualColor) {
    let selectedColor = [];
    let currentSim = colorSim(actualColor, PaletteList[palette][0]);
    let nextColor;
    PaletteList[palette].forEach((color) => {
      nextColor = colorSim(actualColor, color);
      if (nextColor <= currentSim) {
        selectedColor = color;
        currentSim = nextColor;
      }
    });
    return selectedColor;
  }

  const makePaletteGradient = () => {
    //create palette
    let pdivs = "";
    //create palette of colors
    document.querySelector("#palettecolor").innerHTML = "";
    PaletteList.forEach((palette, i) => {
      const option = document.createElement("option");
      option.value = i;
      palette.forEach((elem) => {
        let div = document.createElement("div");
        div.classList = "colorblock";
        div.style.backgroundColor = `rgba(${elem[0]},${elem[1]},${elem[2]},1)`;
        option.appendChild(div);
      });
      document.getElementById("paletteselector").appendChild(option);
    });
  };

  const generatePixel = (file) => {
    const c = $("#pixelitcanvas")[0];
    const ctx = c.getContext('2d');
    let img = new Image()

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

        if (palette > 0) {
          var imgPixels = ctx.getImageData(0, 0, w, h);
          for (var y = 0; y < imgPixels.height; y++) {
            for (var x = 0; x < imgPixels.width; x++) {
              var i = y * 4 * imgPixels.width + x * 4;
              const finalcolor = similarColor([
                imgPixels.data[i],
                imgPixels.data[i + 1],
                imgPixels.data[i + 2],
              ]);
              imgPixels.data[i] = finalcolor[0];
              imgPixels.data[i + 1] = finalcolor[1];
              imgPixels.data[i + 2] = finalcolor[2];
            }
          }
          ctx.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
        }

        $("#pixelImgs").append(`<div class="pixelImg" data-size="${size}"><img src="${c.toDataURL('image/png')}" width="200" /></div>`);
      }

      c.style.visibility = "hidden";
      c.style.height = 0;

    };

    typeof file == "string" ? img.src = file : img.src = URL.createObjectURL(file);
  }

  const reset = () => {
    $(".pixelImg").remove();
    $(".selectedBlock").hide();
    $("#loading").hide();
    palette = 0;
    blockSize = 0;
  }

  new SlimSelect({
    hideSelectedOption: true,
    showSearch: false,
    select: "#paletteselector",
    onChange: (info) => {
      reset();
      palette = info.value;
      generatePixel($("#sourceFile").attr("src"));
    },
  });

  if (window.ethereum) {
    checkChainId();
    toggleAddress();
    makePaletteGradient();
    reset();

    $("#loginBtn").on("click", function() {
      checkLogin();
    })

    $("#uploadBtn").on("click", function() {
      $("#pixlInput").click();
    })

    $("#pixlInput").on("change", function() {
      reset();
      let file = $(this).prop("files")[0];
      $("#sourceFile").attr("src", URL.createObjectURL(file));
      generatePixel(file);
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