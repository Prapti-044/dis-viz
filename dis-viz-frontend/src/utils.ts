import React  from 'react';

export const codeColors = [
  '#C1DBE3',
  '#C7DFC5',
  '#F6FEAA',
  '#FCE694'
]

export const MAX_FN_SIZE = 32
export function shortenName(name: string, len: number): string {
  console.assert(len >= 20, "len should be larger than 20")
  const suffix = name.split(": ")[1]
  name = name.split(": ")[0]
  return (name.length<=len ? name : name.slice(0, 10) + '...' + name.slice(-10)) + ":" + suffix;
}

export function hexToHSL(H: string) {
  // Convert hex to RGB first
  let r: number = 0, g: number = 0, b: number = 0;
  if (H.length == 4) {
    r = parseInt("0x" + H[1] + H[1])
    g = parseInt("0x" + H[2] + H[2])
    b = parseInt("0x" + H[3] + H[3])
  } else if (H.length == 7) {
    r = parseInt("0x" + H[1] + H[2])
    g = parseInt("0x" + H[3] + H[4])
    b = parseInt("0x" + H[5] + H[6])
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  let cmin = Math.min(r,g,b),
      cmax = Math.max(r,g,b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

  if (delta == 0)
    h = 0;
  else if (cmax == r)
    h = ((g - b) / delta) % 6;
  else if (cmax == g)
    h = (b - r) / delta + 2;
  else
    h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0)
    h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h, s, l };
}


//create your forceUpdate hook
export function useForceUpdate(){
    const [value, setValue] = React.useState(0); // integer state
    return () => setValue(value => value + 1); // update state to force render
    // An function that increment 👆🏻 the previous state like here 
    // is better than directly setting `value + 1`
}

export function disLineToId(disId: number, address: number) {
  return disId.toString() + "-" + "instruction-"+address
}

export function isHex(value: string) {
  const hexRegex = /^(0x)?[0-9A-Fa-f]+$/;
  return hexRegex.test(value);
}

export function toHex(value: string) {
  let parsedValue = value.slice()
  if (parsedValue.startsWith('0x')) 
  parsedValue = parsedValue.slice(2)

  return parseInt(parsedValue, 16)
}