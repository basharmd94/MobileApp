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
  is_mock_location?: boolean;
  dev_options_enabled?: boolean;
}
