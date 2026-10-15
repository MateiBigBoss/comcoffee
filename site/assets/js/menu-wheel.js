/* Five upright cups travel around one pivot. Only three are visible at rest. */
class CoffeeWheel {
  constructor(host, choices, select, reduce) {
    this.host = host;
    this.choices = choices;
    this.select = select;
    this.reduce = reduce;
    this.current = 0;
    this.animations = [];
    this.slots = [-2, -1, 0, 1, 2].map(offset => {
      const spoke = document.createElement('div');
      spoke.className = 'wheel-spoke';
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'wheel-cup';
      // The arrows and the named drink list provide the keyboard controls.
      card.tabIndex = -1;
      const image = document.createElement('img');
      image.alt = '';
      image.width = image.height = 1254;
      image.draggable = false;
      const label = document.createElement('span');
      card.append(image, label);
      spoke.append(card);
      host.append(spoke);
      const slot = { offset, spoke, card, image, label, index: 0 };
      card.addEventListener('click', () => select(slot.index, Math.sign(offset)));
      image.addEventListener('error', () => { image.style.visibility = 'hidden'; });
      image.addEventListener('load', () => { image.style.visibility = ''; });
      return slot;
    });
    this.render(0);
    host.hidden = false;
    host.parentElement.classList.add('wheel-ready');
    reduce.addEventListener('change', () => { if (reduce.matches) this.cancel(); });
  }
  neighbor(index, offset) {
    const start = index < 7 ? 0 : 7, length = index < 7 ? 7 : 5;
    return start + ((index - start + offset) % length + length) % length;
  }
  shape(offset) {
    const distance = Math.abs(offset);
    return {
      angle: offset * 44,
      scale: distance === 0 ? 1 : .51,
      opacity: distance === 0 ? 1 : distance === 1 ? .36 : 0
    };
  }
  pose(slot, offset) {
    const shape = this.shape(offset);
    slot.spoke.style.transform = `rotate(${shape.angle}deg)`;
    slot.card.style.transform = `translate(-50%, -50%) rotate(${-shape.angle}deg) scale(${shape.scale})`;
    slot.card.style.opacity = shape.opacity;
    slot.spoke.style.zIndex = offset === 0 ? 3 : 1;
  }
  render(index) {
    this.current = index;
    for (const slot of this.slots) {
      slot.index = this.neighbor(index, slot.offset);
      const choice = this.choices[slot.index];
      const name = choice.lastElementChild.textContent;
      const src = `assets/img/menu/${choice.dataset.slug}.png`;
      if (slot.image.getAttribute('src') !== src) slot.image.src = src;
      slot.label.textContent = slot.offset ? name : '';
      slot.card.setAttribute('aria-label', `Alege ${name}`);
      slot.card.disabled = slot.offset === 0 || Math.abs(slot.offset) > 1;
      slot.card.setAttribute('aria-hidden', String(slot.card.disabled));
      this.pose(slot, slot.offset);
    }
    this.host.parentElement.style.setProperty('--coffee-accent', this.choices[index].dataset.color);
  }
  cancel() {
    this.animations.forEach(animation => animation.cancel());
    this.animations = [];
  }
  async animateShift(direction, entering = false, fading = false) {
    if (this.reduce.matches || !this.host.animate) return;
    const promises = [];
    for (const slot of this.slots) {
      const from = this.shape(slot.offset + (entering ? direction : 0));
      const to = this.shape(slot.offset - (entering ? 0 : direction));
      const options = { duration: fading ? 300 : 680, easing: 'cubic-bezier(.22,.72,.18,1)', fill: 'forwards' };
      const orbit = slot.spoke.animate([
        { transform: `rotate(${from.angle}deg)` }, { transform: `rotate(${to.angle}deg)` }
      ], options);
      const cup = slot.card.animate([
        { transform: `translate(-50%, -50%) rotate(${-from.angle}deg) scale(${from.scale})`, opacity: entering && fading ? 0 : from.opacity },
        { transform: `translate(-50%, -50%) rotate(${-to.angle}deg) scale(${to.scale})`, opacity: !entering && fading ? 0 : to.opacity }
      ], options);
      this.animations.push(orbit, cup);
      promises.push(orbit.finished.catch(() => {}), cup.finished.catch(() => {}));
    }
    await Promise.all(promises);
  }
  async move(index, direction) {
    // Adjacent selections share the same cup throughout the entire arc.
    const adjacent = this.neighbor(this.current, direction) === index;
    this.host.classList.add('is-turning');
    if (adjacent) {
      await this.animateShift(direction);
      this.render(index);
      this.cancel();
    } else {
      await this.animateShift(direction, false, true);
      this.render(index);
      this.cancel();
      await this.animateShift(direction, true, true);
      this.cancel();
    }
    this.host.classList.remove('is-turning');
  }
}
