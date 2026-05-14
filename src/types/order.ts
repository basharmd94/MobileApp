export interface CartItemPayload {
  xdate: string;
  xdesc: string;
  xitem: string;
  xlat: number;
  xlinetotal: number;
  xlong: number;
  xprice: number;
  xqty: number;
  xroword: number;
  xsl: string;
}

export interface OrderPayload {
  items: CartItemPayload[];
  xcus: string;
  xcusadd: string;
  xcusname: string;
  zid: number;
}
