# Client Presentation Script

> Scenario: [Emergency Department Throughput Crunch](./ed-throughput-crunch.md)
>
> Goal: demonstrate that DashForge can move from realistic healthcare context
> to a production-shaped dashboard artifact during a client conversation.

---

## Demo Outcome

By the end of this walkthrough, the client should believe three things:

1. DashForge can create a believable healthcare operating scenario quickly.
2. DashForge can shape that scenario live into an executive-ready dashboard.
3. DashForge produces an artifact that can continue into delivery instead of
   dying as a workshop screenshot.

---

## Opening Setup

### Presenter Notes

Open with the problem, not the product.

### Talk Track

"Most dashboard workshops fail in one of two ways. Either the team spends all
its time talking abstractly and leaves without anything concrete, or they make
a pretty mockup that engineering has to rebuild from scratch later.

DashForge is designed to close that gap. It lets us generate a realistic
operating scenario, shape the dashboard live with you, and leave with a
structured artifact that can keep moving toward production."

---

## Step 1: Ground The Client In The Scenario

### What To Show

- The scenario brief:
  [ed-throughput-crunch.md](/Users/lee/projects/dashForge/scenarios/healthcare/ed-throughput-crunch.md)

### Talk Track

"Let’s use a healthcare operations example. This scenario is a six-hospital
system dealing with persistent emergency department congestion after a winter
respiratory surge.

The core question is not just 'are waits up?' It’s 'which facilities are
driving the problem, what operational drivers explain it, and where should we
intervene this week?'"

### What To Emphasize

- The scenario feels like a real management problem
- The audience is clear: COO, CNO, hospital leadership
- The business question is explicit before any dashboard is shown

---

## Step 2: Explain The DashForge Value In Plain Language

### Talk Track

"What DashForge gives us is a fast path from scenario to working dashboard.
We can start with realistic mock data, choose the right dashboard intent,
compose the view live, and keep the result in a structured specification that
delivery teams can extend later.

So this is not just a brainstorming aid. It is a workshop accelerator that
produces a real starting point."

### What To Emphasize

- Speed
- Realism
- Reusability
- Lower handoff friction

---

## Step 3: Show The Initial Scenario-Driven Dashboard

### What To Show

- The DashForge app with a healthcare dashboard loaded
- A view that highlights:
  - ED arrivals
  - door-to-provider time
  - left-without-being-seen rate
  - boarding hours
  - patient satisfaction

### Talk Track

"Here is the first pass. We are not starting from a blank page. We are starting
from a healthcare scenario with plausible operational signals already in place.

What matters is that the dashboard already reflects a story: system pressure is
visible, two facilities appear to be carrying more of the burden, and the
quality and experience metrics are starting to move with throughput."

### What To Emphasize

- The dashboard has business meaning immediately
- It is not random charts
- The data already supports a management conversation

---

## Step 4: Narrate The Executive Story

### Talk Track

"If I were presenting this to a hospital COO, I’d say:

'This is not a one-week anomaly. We have six weeks of elevated ED wait time,
and the pattern is concentrated rather than uniform. Metro Community and North
Medical are the biggest contributors. Boarding hours are up before patient
satisfaction drops, which suggests inpatient flow is amplifying the front-door
problem.'

That is the point of the first dashboard pass. It turns raw operational data
into a leadership conversation."

### What To Emphasize

- DashForge supports decision storytelling, not just visualization
- The first readout is already executive-friendly

---

## Step 5: Edit The Dashboard Live

### What To Show

- Builder mode
- Rearranging widgets
- Changing emphasis from executive summary to operational detail
- Adding or switching a chart
- Adjusting a title or narrative framing

### Talk Track

"Now let’s do the part that usually breaks in a workshop: adapting the dashboard
live.

If you tell me this is too executive and you want more operating detail, we can
change that right now. If you want to compare facilities instead of just seeing
the system rollup, we can reshape the layout and the narrative without starting
over."

### What To Emphasize

- The dashboard is editable in the room
- The product supports collaboration during discovery
- The workshop artifact evolves instead of being discarded

---

## Step 6: Show How AI Can Accelerate The First Draft

### What To Show

- AI prompt entry
- Generation of a candidate dashboard/spec
- Apply or discard workflow

### Talk Track

"We can also accelerate the first draft with AI, but in a bounded way. We are
not asking a model to invent the business blindly. We are giving it scenario,
intent, and domain context, then reviewing the candidate before it becomes the
active dashboard.

That means AI helps us move faster without making the workshop unpredictable."

### What To Emphasize

- AI is assistive, not uncontrolled
- Candidate review protects quality
- Domain framing stays explicit

---

## Step 7: Show Presenter Mode

### What To Show

- Presenter mode
- Story arc or guided sequence
- An emphasis step on the most important facilities or KPIs

### Talk Track

"Once we have the dashboard shape we want, we can switch from build mode into
presentation mode. This is useful because workshop participants often need a
guided narrative, not a wall of information.

So instead of saying 'please stare at nine charts,' we can walk them through
the progression: system pressure, facility concentration, operational driver,
recommended intervention."

### What To Emphasize

- One artifact supports both building and storytelling
- DashForge works for collaborative sessions and executive playback

---

## Step 8: Show The Production-Shaped Handoff

### What To Show

- Export of the dashboard spec
- Optional mention of `mock`, `live`, and `hybrid` data modes

### Talk Track

"This is the part customers usually care about once they realize the demo is
real: what happens after the workshop?

The answer is that we keep a structured dashboard artifact. That means the
delivery team does not have to recreate the design from screenshots. They can
start from the same specification, keep the mock-backed version for workshop
storytelling, and then progressively bind parts of it to live data."

### What To Emphasize

- The dashboard is exportable and structured
- Delivery can inherit the result
- The workshop output can evolve from mock to live

---

## Step 9: Close With The Commercial Message

### Talk Track

"What DashForge really buys you is compression of time and risk.

Instead of spending days preparing a workshop and then weeks translating it
into something delivery can use, you can create a realistic scenario, shape the
dashboard live, align the narrative with stakeholders, and leave with something
your engineering team can actually build from.

That means faster workshops, better stakeholder alignment, and less waste
between discovery and implementation."

---

## Suggested Live Demo Sequence

1. Open the scenario brief and frame the business problem.
2. Open DashForge on a healthcare dashboard tied to the scenario.
3. Explain the first executive readout.
4. Switch to builder mode and make one or two meaningful changes live.
5. Show AI-assisted candidate generation as an accelerator, not a gimmick.
6. Switch to presenter mode and walk the narrative.
7. End on export / structured artifact / mock-to-live evolution.

---

## Demo Guardrails

- Do not lead with features; lead with the client problem.
- Do not show every capability; show the shortest path to belief.
- Keep the scenario clinically plausible and operationally recognizable.
- Use AI as a speed enhancer, not the centerpiece.
- Always close on continuity into delivery.

---

## One-Sentence Close

"DashForge helps us turn a client workshop from a conversation about dashboards
into the first real version of one."
