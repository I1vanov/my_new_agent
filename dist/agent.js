"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var web3_1 = __importDefault(require("web3"));
var forta_agent_1 = require("forta-agent");
var HIGH_GAS_THRESHOLD = "7000000";
var AAVE_V2_ADDRESS = "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9";
var FLASH_LOAN_EVENT_SIGNATURE = "FlashLoan(address,address,address,uint256,uint256,uint16)";
var INTERESTING_PROTOCOLS = ["0xacd43e627e64355f1861cec6d3a6688b31a6f952"]; // Yearn Dai vault
var BALANCE_DIFF_THRESHOLD = "200000000000000000000"; // 200 eth
var web3 = new web3_1.default((0, forta_agent_1.getJsonRpcUrl)());
console.log(web3);
function provideHandleTransaction(web3) {
    return function handleTransaction(txEvent) {
        return __awaiter(this, void 0, void 0, function () {
            var findings, flashLoanEvents, protocolAddress, blockNumber, currentBalance, _a, previousBalance, _b, balanceDiff;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        findings = [];
                        // if gas too low
                        if (new bignumber_js_1.default(txEvent.gasUsed).isLessThan(HIGH_GAS_THRESHOLD))
                            return [2 /*return*/, findings];
                        // if aave not involved
                        if (!txEvent.addresses[AAVE_V2_ADDRESS])
                            return [2 /*return*/, findings];
                        flashLoanEvents = txEvent.filterEvent(FLASH_LOAN_EVENT_SIGNATURE);
                        if (!flashLoanEvents.length)
                            return [2 /*return*/, findings];
                        protocolAddress = INTERESTING_PROTOCOLS.find(function (address) { return txEvent.addresses[address]; });
                        if (!protocolAddress)
                            return [2 /*return*/, findings];
                        blockNumber = txEvent.blockNumber;
                        _a = bignumber_js_1.default.bind;
                        return [4 /*yield*/, web3.eth.getBalance(protocolAddress, blockNumber)];
                    case 1:
                        currentBalance = new (_a.apply(bignumber_js_1.default, [void 0, _c.sent()]))();
                        _b = bignumber_js_1.default.bind;
                        return [4 /*yield*/, web3.eth.getBalance(protocolAddress, blockNumber - 1)];
                    case 2:
                        previousBalance = new (_b.apply(bignumber_js_1.default, [void 0, _c.sent()]))();
                        balanceDiff = previousBalance.minus(currentBalance);
                        if (balanceDiff.isLessThan(BALANCE_DIFF_THRESHOLD))
                            return [2 /*return*/, findings];
                        findings.push(forta_agent_1.Finding.fromObject({
                            name: "Flash Loan With Loss Detection",
                            description: "Flash loan with loss is detected.",
                            alertId: "NETHFORTA-6",
                            protocol: "Aave",
                            type: forta_agent_1.FindingType.Suspicious,
                            severity: forta_agent_1.FindingSeverity.High,
                            metadata: {
                                protocol: protocolAddress,
                                balanceDiff: balanceDiff.toString(),
                                loans: JSON.stringify(flashLoanEvents)
                            }
                        }));
                        return [2 /*return*/, findings];
                }
            });
        });
    };
}
exports.default = {
    provideHandleTransaction: provideHandleTransaction,
    handleTransaction: provideHandleTransaction(web3)
};
