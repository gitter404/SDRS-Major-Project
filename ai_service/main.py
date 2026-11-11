# Setup: pip install -r requirements.txt ; python -m spacy download en_core_web_sm
# Run:   uvicorn main:app --port 8000
import random, re
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.ensemble import RandomForestClassifier
try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None

CATS = {
    "Medical": ["injured","bleeding","unconscious","heart","hospital","pain","breathing","ambulance","medicine","fracture","sick"],
    "Fire": ["fire","smoke","burning","blast","explosion","flames","gas"],
    "Rescue": ["trapped","stuck","flood","landslide","collapsed","drowning","missing","rescue","rubble","earthquake"],
    "Shelter": ["homeless","shelter","food","water","refuge","displaced","cold","evacuate","camp"],
}
URGENT = ["urgent","immediately","emergency","help","critical","dying","severe","trapped","unconscious","bleeding","children","child","elderly","pregnant","many","multiple","spreading","drowning","now"]
CAT_IDX = {c: i for i, c in enumerate(CATS)}

def tokens_of(text):
    t = text.lower()
    raw = [w.strip(".,!?;:") for w in t.split()]
    if nlp:
        return list({*raw, *[x.lemma_.lower() for x in nlp(t) if not x.is_stop and not x.is_punct]})
    return raw

def locations_of(text):
    locs = []
    if nlp:
        locs += [e.text.strip() for e in nlp(text).ents if e.label_ in ("GPE", "LOC", "FAC")]
    locs += [m.strip() for m in re.findall(r"\b(?:near|at|in|on|around|opposite|behind|outside)\s+((?:[A-Z][\w']*\s?){1,3})", text)]
    seen, out = set(), []
    for l in locs:
        if l and l.lower() not in seen:
            seen.add(l.lower()); out.append(l)
    return out

def feats(toks, text, cat):
    u = sum(1 for k in toks if k in URGENT)
    c = sum(1 for k in toks if any(k in v for v in CATS.values()))
    return [u, c, CAT_IDX[cat], int(any(ch.isdigit() for ch in text)), min(len(toks), 50)]

# Baseline Random Forest trained on synthetic data at startup
random.seed(1)
X, y = [], []
for _ in range(600):
    u, c, ci, d, l = random.randint(0, 6), random.randint(0, 5), random.randint(0, 3), random.randint(0, 1), random.randint(3, 50)
    X.append([u, c, ci, d, l])
    y.append(max(1, min(10, 2 + u + (c // 2) + (2 if ci in (0, 1) else 0) + d)))
rf = RandomForestClassifier(n_estimators=50, random_state=1).fit(X, y)

app = FastAPI()
class Report(BaseModel):
    text: str

@app.post("/analyze-report")
def analyze(r: Report):
    toks = tokens_of(r.text)
    scores = {c: sum(1 for k in toks if k in kw) for c, kw in CATS.items()}
    cat = max(scores, key=scores.get) if any(scores.values()) else "Rescue"
    f = feats(toks, r.text, cat)
    sev = min(3, sum(1 for k in ["trapped","unconscious","bleeding","fire","drowning","collapsed","explosion","dying"] if k in toks))
    base = 2 + f[0] + f[1] // 2 + (2 if f[2] in (0, 1) else 0) + f[3] + sev
    pr = max(int(rf.predict([f])[0]), min(10, max(1, base)))
    found = sorted({k for k in toks if k in URGENT or any(k in v for v in CATS.values())})
    return {"category": cat, "priority": pr, "tokens": found, "locations": locations_of(r.text)}