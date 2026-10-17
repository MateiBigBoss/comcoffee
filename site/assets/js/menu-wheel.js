/* The next cup waits below-right; the departing cup leaves the stage. */
class CoffeeWheel {
  constructor(host, choices, select, reduce) {
    this.host = host;
    this.choices = choices;
    this.scene = host.parentElement.parentElement;
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
      card.addEventListener('click', () => select(slot.index, Math.sign(slot.offset)));
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
      angle: offset * 62,
      // Shrink early when leaving and grow late when arriving, leaving room
      // between cups even halfway around the arc.
      scale: .32 + .68 * Math.pow(Math.max(0, 1 - distance), 2.8),
      opacity: offset < 0 ? Math.pow(Math.max(0, 1 + offset), 1.4) : distance <= 1 ? .26 + .74 * Math.pow(1 - distance, 1.4) : Math.max(0, .26 * Math.pow(Math.max(0, 2 - distance), 3))
    };
  }
  orbit(angle) {
    const edge = Math.max(-62, Math.min(62, angle));
    const radians = edge * Math.PI / 180;
    const extra = (angle - edge) * Math.PI / 180;
    // The previous cup travels beyond the left edge, instead of remaining
    // as a thumbnail. The upcoming cup waits in the lower-right corner.
    const position = angle / 62;
    const x = position < 0 ? 2.3 * position
      : .55 * Math.sin(radians) + extra * .55 * Math.cos(radians);
    const y = position < 0 ? 1.6 * position
      : Math.sin(radians) + extra * Math.cos(radians);
    return `translate(calc(var(--orbit-radius) * ${x} * var(--orbit-spread)), calc(var(--orbit-radius) * ${y} * var(--orbit-rise)))`;
  }
  pose(slot, offset) {
    const shape = this.shape(offset);
    slot.spoke.style.transform = this.orbit(shape.angle);
    slot.card.style.transform = `translate(-50%, -50%) scale(${shape.scale})`;
    slot.card.style.opacity = shape.opacity;
    slot.spoke.style.zIndex = offset === 0 ? 3 : 1;
  }
  render(index, refresh = false) {
    this.current = index;
    for (const slot of this.slots) {
      slot.index = this.neighbor(index, slot.offset);
      const choice = this.choices[slot.index];
      const name = choice.lastElementChild.textContent;
      const src = `assets/img/menu/${choice.dataset.slug}.png`;
      if (slot.image.getAttribute('src') !== src || (refresh && slot.offset === 0)) slot.image.src = src;
      slot.label.textContent = '';
      slot.card.setAttribute('aria-label', `Alege ${name}`);
      slot.card.disabled = slot.offset !== 1;
      slot.card.setAttribute('aria-hidden', String(slot.card.disabled));
      this.pose(slot, slot.offset);
    }
    this.theme(index);
  }
  theme(index) {
    const data = this.choices[index].dataset;
    this.host.parentElement.style.setProperty('--coffee-accent', data.color);
    this.scene?.style.setProperty('--coffee-accent', data.color);
    this.scene?.style.setProperty('--scene-color', data.scene || '#ddd2bf');
  }
  cancel() {
    this.animations.forEach(animation => animation.cancel());
    this.animations = [];
  }
  async animateShift(direction, entering = false, fading = false) {
    if (this.reduce.matches || !this.host.animate) return;
    const promises = [];
    for (const slot of this.slots) {
      const orbitFrames = [], cupFrames = [];
      for (let step = 0; step <= 20; step++) {
        const progress = step / 20;
        const position = slot.offset + (entering ? direction : 0) - direction * progress;
        const shape = this.shape(position);
        const fade = fading ? (entering ? progress : 1 - progress) : 1;
        orbitFrames.push({ offset:progress, transform:this.orbit(shape.angle) });
        cupFrames.push({ offset:progress, transform:`translate(-50%, -50%) scale(${shape.scale})`, opacity:shape.opacity * fade });
      }
      const options = { duration: fading ? 460 : 920, easing: 'cubic-bezier(.4,0,.16,1)', fill: 'forwards' };
      const orbit = slot.spoke.animate(orbitFrames, options);
      const cup = slot.card.animate(cupFrames, options);
      this.animations.push(orbit, cup);
      promises.push(orbit.finished.catch(() => {}), cup.finished.catch(() => {}));
    }
    await Promise.all(promises);
  }
  async move(index, direction) {
    // Adjacent selections share the same cup throughout the entire arc.
    const adjacent = this.neighbor(this.current, direction) === index;
    this.cancel();
    this.theme(index);
    this.host.classList.add('is-turning');
    if (adjacent) {
      await this.animateShift(direction);
      // Reuse the actual arriving image instead of swapping visible image sources.
      // Only the invisible far-side cup is recycled after crossing the boundary.
      for (const slot of this.slots) {
        slot.offset -= direction;
        if (slot.offset < -2) slot.offset += 5;
        if (slot.offset > 2) slot.offset -= 5;
      }
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
