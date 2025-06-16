import * as liquidSdk from '@breeztech/react-native-breez-sdk-liquid';
import {
  PrepareSendRequest,
  PrepareSendResponse,
  SendPaymentRequest,
  SendPaymentResponse,
  PrepareReceiveRequest,
  PrepareReceiveResponse,
  ReceivePaymentRequest,
  ReceivePaymentResponse,
  PaymentMethod,
  PaymentType,
  PaymentState,
  Payment,
  InputType,
  InputTypeVariant,
  LnInvoice,
  LiquidAddressData,
  BitcoinAddressData,
  PayAmount,
  PayAmountVariant,
  ReceiveAmount,
  ReceiveAmountVariant,
} from '@breeztech/react-native-breez-sdk-liquid';

export interface PaymentResult {
  txId: string;
  amountSat: number;
  fees: number;
  destination: string;
  paymentType: PaymentType;
}

export interface InvoiceResult {
  destination: string;
  amountSat: number;
  description: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentValidation {
  isValid: boolean;
  error?: string;
  amountSat?: number;
  description?: string;
  paymentType?: string;
}

export class PaymentService {
  /**
   * Parse and validate a payment destination using the SDK's parse function
   */
  static async parseDestination(destination: string): Promise<InputType> {
    try {
      return await liquidSdk.parse(destination.trim());
    } catch (error: any) {
      throw new Error(`Invalid destination: ${error.message}`);
    }
  }

  /**
   * Validate a payment destination (Lightning invoice, Bitcoin address, etc.)
   */
  static async validateDestination(destination: string): Promise<PaymentValidation> {
    try {
      // First parse the destination to understand its type
      const parsedInput = await this.parseDestination(destination);
      
      // Then prepare send request to validate and get fee information
      const prepareRequest: PrepareSendRequest = {
        destination: destination.trim(),
      };

      const prepareResponse: PrepareSendResponse = await liquidSdk.prepareSendPayment(prepareRequest);
      
      // Determine payment type based on parsed input
      let paymentType = 'unknown';
      let amountSat = 0;
      
      switch (parsedInput.type) {
        case InputTypeVariant.BOLT11:
          paymentType = 'lightning';
          amountSat = parsedInput.invoice.amountMsat ? Math.floor(parsedInput.invoice.amountMsat / 1000) : 0;
          break;
        case InputTypeVariant.LIQUID_ADDRESS:
          paymentType = 'liquid';
          amountSat = parsedInput.address.amountSat || 0;
          break;
        case InputTypeVariant.BITCOIN_ADDRESS:
          paymentType = 'bitcoin';
          amountSat = parsedInput.address.amountSat || 0;
          break;
        case InputTypeVariant.BOLT12_OFFER:
          paymentType = 'bolt12';
          break;
        default:
          paymentType = 'unknown';
      }
      
      return {
        isValid: true,
        amountSat: prepareResponse.amount?.type === PayAmountVariant.BITCOIN ? 
          prepareResponse.amount.receiverAmountSat : amountSat,
        description: 'Valid payment destination',
        paymentType,
      };
    } catch (error: any) {
      console.error('Invalid destination:', error);
      return {
        isValid: false,
        error: error.message || 'Invalid payment destination',
      };
    }
  }

  /**
   * Send a payment to any supported destination
   */
  static async sendPayment(destination: string, amountSat?: number): Promise<PaymentResult> {
    try {
      console.log('🚀 Preparing to send payment...');
      
      // Prepare the payment with optional amount
      const prepareRequest: PrepareSendRequest = {
        destination: destination.trim(),
      };

      // Add amount if specified (for destinations that require it)
      if (amountSat) {
        prepareRequest.amount = {
          type: PayAmountVariant.BITCOIN,
          receiverAmountSat: amountSat,
        };
      }

      const prepareResponse: PrepareSendResponse = await liquidSdk.prepareSendPayment(prepareRequest);
      console.log('✅ Payment prepared, fees:', prepareResponse.feesSat);

      // Execute the payment
      console.log('💸 Executing payment...');
      const sendRequest: SendPaymentRequest = {
        prepareResponse: prepareResponse,
        useAssetFees: false, // Use BTC for fees (set to true for L-BTC fees)
      };
      
      const sendResponse: SendPaymentResponse = await liquidSdk.sendPayment(sendRequest);

      return {
        txId: sendResponse.payment.txId || 'pending',
        amountSat: sendResponse.payment.amountSat,
        fees: sendResponse.payment.feesSat,
        destination: destination,
        paymentType: sendResponse.payment.paymentType,
      };
    } catch (error: any) {
      console.error('❌ Failed to send payment:', error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  /**
   * Create a Lightning invoice to receive payment
   */
  static async createLightningInvoice(amountSat: number, description: string = ''): Promise<InvoiceResult> {
    try {
      console.log('💰 Creating Lightning invoice...');
      
      const prepareRequest: PrepareReceiveRequest = {
        paymentMethod: PaymentMethod.LIGHTNING,
        amount: {
          type: ReceiveAmountVariant.BITCOIN,
          payerAmountSat: amountSat,
        },
      };

      const prepareResponse: PrepareReceiveResponse = await liquidSdk.prepareReceivePayment(prepareRequest);
      
      const receiveRequest: ReceivePaymentRequest = {
        prepareResponse: prepareResponse,
        description: description,
        useDescriptionHash: false,
      };

      const receiveResponse: ReceivePaymentResponse = await liquidSdk.receivePayment(receiveRequest);

      return {
        destination: receiveResponse.destination,
        amountSat: amountSat,
        description: description,
        paymentMethod: PaymentMethod.LIGHTNING,
      };
    } catch (error: any) {
      console.error('❌ Failed to create Lightning invoice:', error);
      throw new Error(`Failed to create Lightning invoice: ${error.message}`);
    }
  }

  /**
   * Create a Liquid address to receive payment
   */
  static async createLiquidAddress(description: string = ''): Promise<InvoiceResult> {
    try {
      console.log('🌊 Creating Liquid address...');
      
      const prepareRequest: PrepareReceiveRequest = {
        paymentMethod: PaymentMethod.LIQUID_ADDRESS,
      };

      const prepareResponse: PrepareReceiveResponse = await liquidSdk.prepareReceivePayment(prepareRequest);
      
      const receiveRequest: ReceivePaymentRequest = {
        prepareResponse: prepareResponse,
        description: description,
      };

      const receiveResponse: ReceivePaymentResponse = await liquidSdk.receivePayment(receiveRequest);

      return {
        destination: receiveResponse.destination,
        amountSat: 0, // Liquid addresses don't have fixed amounts
        description: description,
        paymentMethod: PaymentMethod.LIQUID_ADDRESS,
      };
    } catch (error: any) {
      console.error('❌ Failed to create Liquid address:', error);
      throw new Error(`Failed to create Liquid address: ${error.message}`);
    }
  }

  /**
   * Create a Bitcoin address to receive payment
   */
  static async createBitcoinAddress(description: string = ''): Promise<InvoiceResult> {
    try {
      console.log('₿ Creating Bitcoin address...');
      
      const prepareRequest: PrepareReceiveRequest = {
        paymentMethod: PaymentMethod.BITCOIN_ADDRESS,
      };

      const prepareResponse: PrepareReceiveResponse = await liquidSdk.prepareReceivePayment(prepareRequest);
      
      const receiveRequest: ReceivePaymentRequest = {
        prepareResponse: prepareResponse,
        description: description,
      };

      const receiveResponse: ReceivePaymentResponse = await liquidSdk.receivePayment(receiveRequest);

      return {
        destination: receiveResponse.destination,
        amountSat: 0, // Bitcoin addresses don't have fixed amounts
        description: description,
        paymentMethod: PaymentMethod.BITCOIN_ADDRESS,
      };
    } catch (error: any) {
      console.error('❌ Failed to create Bitcoin address:', error);
      throw new Error(`Failed to create Bitcoin address: ${error.message}`);
    }
  }

  /**
   * Generic receive payment method that creates Lightning invoice by default
   */
  static async createReceiveInvoice(
    amountSat: number, 
    description: string = '',
    paymentMethod: PaymentMethod = PaymentMethod.LIGHTNING
  ): Promise<InvoiceResult> {
    switch (paymentMethod) {
      case PaymentMethod.LIGHTNING:
        return this.createLightningInvoice(amountSat, description);
      case PaymentMethod.LIQUID_ADDRESS:
        return this.createLiquidAddress(description);
      case PaymentMethod.BITCOIN_ADDRESS:
        return this.createBitcoinAddress(description);
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
  }

  /**
   * Get fee estimation for a payment
   */
  static async estimateFees(destination: string, amountSat?: number): Promise<{
    feesSat: number;
    estimatedAssetFees?: number;
    totalAmountSat: number;
  }> {
    try {
      const prepareRequest: PrepareSendRequest = {
        destination: destination.trim(),
      };

      if (amountSat) {
        prepareRequest.amount = {
          type: PayAmountVariant.BITCOIN,
          receiverAmountSat: amountSat,
        };
      }

      const prepareResponse: PrepareSendResponse = await liquidSdk.prepareSendPayment(prepareRequest);
      
      const finalAmountSat = prepareResponse.amount?.type === PayAmountVariant.BITCOIN ? 
        prepareResponse.amount.receiverAmountSat : amountSat || 0;
      
      return {
        feesSat: prepareResponse.feesSat || 0,
        estimatedAssetFees: prepareResponse.estimatedAssetFees,
        totalAmountSat: finalAmountSat + (prepareResponse.feesSat || 0),
      };
    } catch (error: any) {
      console.error('Failed to estimate fees:', error);
      throw new Error(`Fee estimation failed: ${error.message}`);
    }
  }

  /**
   * Format amount for display
   */
  static formatAmount(amountSat: number): string {
    if (amountSat >= 100000000) {
      return `${(amountSat / 100000000).toFixed(8)} BTC`;
    } else if (amountSat >= 1000) {
      return `${(amountSat / 1000).toFixed(0)}k sats`;
    } else {
      return `${amountSat} sats`;
    }
  }

  /**
   * Convert sats to BTC
   */
  static satsToBTC(sats: number): number {
    return sats / 100000000;
  }

  /**
   * Convert BTC to sats
   */
  static btcToSats(btc: number): number {
    return Math.round(btc * 100000000);
  }

  /**
   * Detect payment destination type
   */
  static async detectDestinationType(destination: string): Promise<{
    type: string;
    isValid: boolean;
    details?: any;
  }> {
    try {
      const parsedInput = await this.parseDestination(destination);
      
      switch (parsedInput.type) {
        case InputTypeVariant.BOLT11:
          return {
            type: 'lightning',
            isValid: true,
            details: parsedInput.invoice,
          };
        case InputTypeVariant.LIQUID_ADDRESS:
          return {
            type: 'liquid',
            isValid: true,
            details: parsedInput.address,
          };
        case InputTypeVariant.BITCOIN_ADDRESS:
          return {
            type: 'bitcoin',
            isValid: true,
            details: parsedInput.address,
          };
        case InputTypeVariant.BOLT12_OFFER:
          return {
            type: 'bolt12',
            isValid: true,
            details: parsedInput.offer,
          };
        case InputTypeVariant.LN_URL_PAY:
          return {
            type: 'lnurl-pay',
            isValid: true,
            details: parsedInput.data,
          };
        default:
          return {
            type: 'unknown',
            isValid: false,
          };
      }
    } catch (error: any) {
      return {
        type: 'unknown',
        isValid: false,
        details: { error: error.message },
      };
    }
  }

  /**
 * Get a stable ID for a payment (fallback if txId is missing)
 */
static getPaymentId(payment: Payment): string {
  if (payment.txId) return payment.txId;
  if (payment.details?.type === 'lightning' && payment.details.paymentHash) {
    return payment.details.paymentHash;
  }
  return `${payment.timestamp}-${payment.amountSat}`;
}
}