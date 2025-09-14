export async function lookupZip(zip: string) {
  const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!res.ok) throw new Error("ZIP not found");
  const data = await res.json();
  const place = data.places?.[0];
  return {
    city: place?.["place name"] || "",
    state: place?.["state abbreviation"] || ""
  };
}
