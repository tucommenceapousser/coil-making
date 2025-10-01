import React, { useState } from 'react'

// Trhacknon Coil Builder - single-file React component
// Uses Tailwind for styling (assumes Tailwind is available in the host project)
// Default export a React component ready to paste in an app (e.g. Vite + React)

export default function CoilBuilder() {
  const materials = {
    'Kanthal A1': { rho_mm2_per_m: 1.45, note: 'Kanthal A1 (good for wattage, not for TC)'},
    'Nichrome (Ni80)': { rho_mm2_per_m: 1.09, note: 'Nichrome — high resistivity, not for TC typically'},
    'SS316L': { rho_mm2_per_m: 0.75, note: 'Stainless Steel 316L — works with TC and VW'},
    'Ni200': { rho_mm2_per_m: 0.70, note: 'Nickel 200 — TC only, fragile'},
    'Titanium (Ti)': { rho_mm2_per_m: 0.42, note: 'Titanium — TC only, use with care'}
  }

  const awgTable = {
    // AWG: diameter in mm (approx)
    20: 0.8128,
    22: 0.6438,
    24: 0.511,
    26: 0.405,
    28: 0.321,
    30: 0.255,
    32: 0.202
  }

  const [material, setMaterial] = useState('SS316L')
  const [wireDiaMm, setWireDiaMm] = useState(awgTable[26])
  const [useAwg, setUseAwg] = useState(true)
  const [awg, setAwg] = useState(26)
  const [wraps, setWraps] = useState(5)
  const [coilIDmm, setCoilIDmm] = useState(3.0)
  const [legsMm, setLegsMm] = useState(6)
  const [targetOhm, setTargetOhm] = useState(0.25)
  const [voltage, setVoltage] = useState(7.4) // default dual battery nominal series
  const [safetyLimitAmp, setSafetyLimitAmp] = useState(30)

  function mmToMeters(x){return x/1000}

  // compute coil length: circumference*wraps + legs
  function computeLengthMeters(wrapsCount, coilIDmm, legsMm){
    const circMm = Math.PI * coilIDmm
    const lengthMm = circMm * wrapsCount + legsMm
    return mmToMeters(lengthMm)
  }

  function areaMm2(diameterMm){
    return Math.PI * Math.pow(diameterMm/2, 2)
  }

  function computeResistanceOhm(materialKey, wireDiameterMm, wrapsCount, coilIDmm, legsMm){
    const mat = materials[materialKey]
    const rho = mat.rho_mm2_per_m // Ω·mm²/m
    const Lm = computeLengthMeters(wrapsCount, coilIDmm, legsMm) // m
    const A_mm2 = areaMm2(wireDiameterMm)
    // R = rho(mm2/m) * L(m) / A(mm2)
    const R = (rho * Lm) / A_mm2
    return R
  }

  function findWrapsForTarget(materialKey, wireDiameterMm, coilIDmm, legsMm, targetOhm, maxWraps=60){
    for(let w=1; w<=maxWraps; w++){
      const r = computeResistanceOhm(materialKey, wireDiameterMm, w, coilIDmm, legsMm)
      if(r >= targetOhm) return {wraps: w, resistance: r}
    }
    const r = computeResistanceOhm(materialKey, wireDiameterMm, maxWraps, coilIDmm, legsMm)
    return {wraps: maxWraps, resistance: r}
  }

  const wireDiameter = useAwg ? awgTable[awg] : Number(wireDiaMm)
  const calcResistance = computeResistanceOhm(material, Number(wireDiameter), Number(wraps), Number(coilIDmm), Number(legsMm))
  const targetResult = findWrapsForTarget(material, Number(wireDiameter), Number(coilIDmm), Number(legsMm), Number(targetOhm))

  // power & current
  const currentAtTarget = voltage / Number(calcResistance || 0.000001)
  const powerAtTarget = Math.pow(currentAtTarget,2) * Number(calcResistance || 0.000001)

  // helper format
  const fmt = (v, n=3)=> Number(v).toFixed(n)

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">trhacknon — Coil Builder</h1>
            <p className="text-sm text-green-300">Design hacking • fluo accents • dark lab UI</p>
          </div>
          <div className="text-right text-xs text-gray-400">Web tool • Arctic Fox friendly</div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="p-4 bg-gray-800 rounded-2xl shadow-lg border border-green-900/30">
            <h2 className="text-xl font-bold mb-3 text-green-300">Inputs</h2>

            <label className="block text-sm text-gray-300 mb-1">Material</label>
            <select className="w-full p-2 mb-3 rounded bg-gray-900 border border-green-800" value={material} onChange={e=>setMaterial(e.target.value)}>
              {Object.keys(materials).map(k=> (
                <option key={k} value={k}>{k} — {materials[k].note}</option>
              ))}
            </select>

            <div className="mb-3">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={useAwg} onChange={e=>setUseAwg(e.target.checked)} className="accent-green-400" />
                Use AWG selector (or uncheck to enter wire diameter in mm)
              </label>
            </div>

            {useAwg ? (
              <div className="mb-3">
                <label className="text-sm text-gray-300">AWG</label>
                <select className="w-full p-2 rounded bg-gray-900 border border-green-800" value={awg} onChange={e=>{setAwg(Number(e.target.value)); setWireDiaMm(awgTable[Number(e.target.value)])}}>
                  {Object.keys(awgTable).map(a=> (
                    <option key={a} value={a}>AWG {a} — {awgTable[a]} mm</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-3">
                <label className="text-sm text-gray-300">Wire diameter (mm)</label>
                <input className="w-full p-2 rounded bg-gray-900 border border-green-800" value={wireDiaMm} onChange={e=>setWireDiaMm(e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-gray-300">Wraps</label>
                <input type="number" className="w-full p-2 rounded bg-gray-900 border border-green-800" value={wraps} onChange={e=>setWraps(Number(e.target.value))} min={1} />
              </div>
              <div>
                <label className="text-sm text-gray-300">Coil inner Ø (mm)</label>
                <input type="number" className="w-full p-2 rounded bg-gray-900 border border-green-800" value={coilIDmm} onChange={e=>setCoilIDmm(Number(e.target.value))} step="0.1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-sm text-gray-300">Legs length (mm)</label>
                <input type="number" className="w-full p-2 rounded bg-gray-900 border border-green-800" value={legsMm} onChange={e=>setLegsMm(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm text-gray-300">Supply voltage (V)</label>
                <input type="number" className="w-full p-2 rounded bg-gray-900 border border-green-800" value={voltage} onChange={e=>setVoltage(Number(e.target.value))} step="0.1" />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-sm text-gray-300">Target resistance (optional, Ω)</label>
              <input type="number" className="w-full p-2 rounded bg-gray-900 border border-green-800" value={targetOhm} onChange={e=>setTargetOhm(Number(e.target.value))} step="0.01" />
            </div>

          </section>

          <section className="p-4 bg-gray-800 rounded-2xl shadow-lg border border-green-900/30">
            <h2 className="text-xl font-bold mb-3 text-green-300">Results</h2>

            <div className="mb-3">
              <div className="text-sm text-gray-300">Wire diameter</div>
              <div className="text-lg font-mono text-white">{fmt(wireDiameter,3)} mm</div>
            </div>

            <div className="mb-3">
              <div className="text-sm text-gray-300">Estimated resistance of your coil</div>
              <div className="text-2xl font-mono text-green-300">{fmt(calcResistance,4)} Ω</div>
              <div className="text-xs text-gray-400 mt-1">{wraps} wraps • {fmt(computeLengthMeters(wraps, coilIDmm, legsMm),4)} m of wire</div>
            </div>

            <div className="mb-3">
              <div className="text-sm text-gray-300">Current & Power at {voltage} V</div>
              <div className="text-lg font-mono">I = {fmt(currentAtTarget,3)} A • P = {fmt(powerAtTarget,2)} W</div>
              <div className={`mt-2 text-sm font-medium ${currentAtTarget > safetyLimitAmp ? 'text-red-400' : 'text-green-300'}`}>
                {currentAtTarget > safetyLimitAmp ? `Warning: estimated current ${fmt(currentAtTarget,2)} A exceeds safety limit ${safetyLimitAmp} A` : `Estimated current ${fmt(currentAtTarget,2)} A — within safety limit ${safetyLimitAmp} A`}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-sm text-gray-300">Find wraps for target resistance ({targetOhm} Ω)</div>
              <div className="text-lg font-mono text-yellow-300">{targetResult.wraps} wraps → {fmt(targetResult.resistance,4)} Ω</div>
              <div className="text-xs text-gray-400 mt-1">(max wraps searched = 60)</div>
            </div>

            <div className="mt-4 p-3 bg-gray-900 rounded border border-green-800">
              <h3 className="text-sm text-green-200 font-bold">Notes & Safety</h3>
              <ul className="text-xs text-gray-400 ml-4 list-disc mt-2">
                <li>Les valeurs sont des estimations basées sur résistivité matérielle et géométrie du coil.</li>
                <li>Pour TC (contrôle de température), utilisez **SS316L**, **Ni200** ou **Ti** selon le firmware (SS316L recommandé).</li>
                <li>Vérifie la résistance mesurée avec un ohmmètre avant d'utiliser sur une box.</li>
                <li>Ne dépasse pas l'ampère admissible de tes accus. Respecte la sécurité batterie (internal resistance, continuous discharge).</li>
                <li>Si tu veux exporter un profil Arctic Fox depuis ces valeurs, je peux générer le .cfg correspondant.</li>
              </ul>
            </div>

          </section>

          <section className="col-span-1 md:col-span-2 p-4 bg-gray-800 rounded-2xl shadow-lg border border-green-900/30">
            <h2 className="text-xl font-bold mb-3 text-green-300">Utilities & Export</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-300">Safety current limit (A)</label>
                <input type="number" className="w-full p-2 rounded bg-gray-900 border border-green-800" value={safetyLimitAmp} onChange={e=>setSafetyLimitAmp(Number(e.target.value))} />
              </div>

              <div>
                <label className="text-sm text-gray-300">Battery setup note</label>
                <div className="text-xs text-gray-400 p-2 rounded bg-gray-900 border border-green-800">Entrez la tension nominale de votre montage (ex: 3.7 pour 1 accu, 7.4 pour 2 en série)</div>
              </div>

              <div>
                <label className="text-sm text-gray-300">Export Arctic Fox .cfg</label>
                <button className="mt-2 w-full p-2 rounded bg-green-500 text-black font-bold hover:brightness-110" onClick={()=>{
                  const profile = {
                    Name: 'DAB-CUSTOM',
                    Mode: materials[material].note.includes('TC') || material.includes('SS') || material.includes('Ni') ? (material==='SS316L' || material==='Ni200' || material.includes('Ti') ? 'TC-SS' : 'Power') : 'Power',
                    Temperature: material==='SS316L' ? 220 : undefined,
                    Power: Math.min(50, Math.round(powerAtTarget)),
                    PreheatPower: Math.round(Math.min(80, Math.max(20, powerAtTarget*1.4))),
                    PreheatTime: 1,
                    Cutoff: 8,
                    Resistance: fmt(calcResistance,4)
                  }
                  const text = `; Generated by trhacknon Coil Builder\n[ProfileCustom]\nName=${profile.Name}\nMode=${profile.Mode}\n${profile.Temperature? `Temperature=${profile.Temperature}\n`: ''}Power=${profile.Power}\nPreheatPower=${profile.PreheatPower}\nPreheatTime=${profile.PreheatTime}\nCutoff=${profile.Cutoff}\n; EstimatedResistance=${profile.Resistance}\n`
                  const blob = new Blob([text], {type: 'text/plain'})
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'arcticfox-profile-dab.cfg'
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                }}>Export .cfg</button>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              <strong>Astuce :</strong> teste d'abord la résistance avec un ohmmètre puis règle la température ou la puissance sur Arctic Fox. Si tu veux que je génère plusieurs profils (VW, TC, Advanced curve), dis-moi et je les prépare prêts à importer.
            </div>

          </section>

        </main>

        <footer className="mt-8 text-center text-xs text-gray-500">Made with ♥ by <span className="text-green-300 font-bold">trhacknon</span> — coil lab UI</footer>
      </div>
    </div>
  )
}
