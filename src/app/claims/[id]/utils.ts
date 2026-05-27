export const getPartAmt = (p: any, purchaseOrders: any[]) => {
  const globalPoItems = purchaseOrders?.filter((po: any) => po.status !== 'CANCELLED').flatMap((po: any) => po.items.map((item: any) => ({ ...item, poId: po.id, poNo: po.poNo, poStatus: po.status }))) || []
  const poi = globalPoItems.find((x: any) => x.partNo === p.partNo)
  return poi ? (poi.unitPrice * (poi.quantity || 1)) : (p.priceApprove * (p.quantity || 1))
}

export const getLaborAmt = (l: any, purchaseOrders: any[]) => {
  const globalPoItems = purchaseOrders?.filter((po: any) => po.status !== 'CANCELLED').flatMap((po: any) => po.items.map((item: any) => ({ ...item, poId: po.id, poNo: po.poNo, poStatus: po.status }))) || []
  const pol = globalPoItems.find((x: any) => x.description?.includes(l.description))
  return pol ? pol.unitPrice : l.priceApprove
}
