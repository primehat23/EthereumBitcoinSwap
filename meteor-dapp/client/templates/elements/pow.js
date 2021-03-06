var ku = require('keccak');
var bnTarget = new BigNumber(2).pow(234);
var kecc = new ku.Keccak();


Template.pow.viewmodel({
  btcTxHash: 'dd5a8f13c97c8b8d47329fa7bd487df24b7d3b7e855a65eb7fd51e8f94f7e482',
  ticketId: 2,
  nonce: 2460830,


  findPoWClicked: function() {
    // put webworker issue #49 on hold.  changest to powWorker.js aren't seen
    // during Meteor's hot reload.
    // these references may help, when getting back to this work:
    // http://stackoverflow.com/questions/28573129/meteor-loaded-worker-wont-update-on-client-after-file-change
    // http://stackoverflow.com/questions/15959501/how-to-add-cors-headers-to-a-meteor-app?lq=1
    // if (window.Worker) {
    //   var powWorker = new Worker('powWorker.js');
    //
    //   powWorker.postMessage([this.btcTxHash(), this.ticketId()]);
    //
    //   powWorker.onmessage = function(event) {
    //     console.log('@@@ worker event: ', event)
    //
    //     powWorker.terminate();
    //
    //     this.nonce(event.data);
    //   }.bind(this);
    //
    //   return;
    // }

    var powNonce = computePow(this.btcTxHash(), this.ticketId());

    this.nonce(powNonce);
  },

  verifyPoWClicked: function() {
    var hexTicketId = new BigNumber(this.ticketId()).toString(16);
    var padLen = 16 - hexTicketId.length;
    var leadZerosForTicketId = Array(padLen + 1).join('0');

    var hexNonce = new BigNumber(this.nonce()).toString(16);
    padLen = 16 - hexNonce.length;
    var leadZerosForNonce = Array(padLen + 1).join('0');

    var bnSrc = new BigNumber('0x' + this.btcTxHash() + leadZerosForTicketId + hexTicketId + leadZerosForNonce + hexNonce);
    var src;
    var bnHash;
    var strHash;

    console.log('@@@ bnSrc: ', bnSrc.toString(16))


    src = ku.hexStringToBytes(bnSrc.toString(16));
    src = new Uint32Array(src.buffer);
    var srcLen = src.length;
    var dst = new Uint32Array(8);
    kecc.digestWords(dst, 0, 8, src, 0, srcLen);

    strHash = ku.wordsToHexString(dst);
    bnHash = new BigNumber('0x' + strHash);

    var isPowValid = bnHash.lt(bnTarget);
    console.log('@@@ isPowValid: ', isPowValid, ' pow: ', bnHash.toString(16), ' target: ', bnTarget.toString(16))

    if (isPowValid) {
      swal('Proof of Work', 'Valid', 'success');
    }
    else {
      swal('Proof of Work', 'Invalid', 'error');
    }
  }
});


function computePow(btcTxHash, ticketId) {
  console.log('@@@ computePow txhash: ', btcTxHash)

  var hexTicketId = new BigNumber(ticketId).toString(16);
  var padLen = 16 - hexTicketId.length;
  var leadZerosForTicketId = Array(padLen + 1).join('0');

  var bnSrc = new BigNumber('0x' + btcTxHash + leadZerosForTicketId + hexTicketId + "0000000000000000");
  var src;
  var bnHash;
  var strHash;

  console.log('@@@ bnSrc: ', bnSrc.toString(16))


  src = ku.hexStringToBytes(bnSrc.toString(16));
  src = new Uint32Array(src.buffer);
  var srcLen = src.length;
  var dst = new Uint32Array(8);
  kecc.digestWords(dst, 0, 8, src, 0, srcLen);

  strHash = ku.wordsToHexString(dst);
  bnHash = new BigNumber('0x' + strHash);


  startTime = new Date().getTime();
  console.log("startTime: ", startTime)

  var i=0;
  while (bnHash.gte(bnTarget) && i < 100000000) {
    bnSrc = bnSrc.add(1);

    src = ku.hexStringToBytes(bnSrc.toString(16));
    src = new Uint32Array(src.buffer);
    kecc.digestWords(dst, 0, 8, src, 0, srcLen);

    strHash = ku.wordsToHexString(dst);
    bnHash = new BigNumber('0x' + strHash);


    i+= 1;
  }

  console.log("endTime: ", new Date().getTime())
  console.log("duration: ", (new Date().getTime() - startTime) / 1000.0)

  console.log('@@@@ i: ', i)
  console.log('@@@ strHash: ', strHash)

  return i;
}
