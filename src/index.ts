/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';


/**
 * The sizer object for the [[boxCalc]] function.
 *
 * A box sizer holds the geometry information for an object along the
 * layout orientation. An array of box sizers representing a line of
 * objects is passed to [[boxCalc]] along with the amount of space
 * available for layout. The algorithm will update the [[size]] of
 * each box sizer with its computed size.
 *
 * #### Notes
 * For best performance, this class should be treated as a raw data
 * struct. It should not typically be subclassed.
 */
export
class BoxSizer {
  /**
   * The preferred size for the sizer.
   *
   * The sizer will be given this initial size subject to its size
   * bounds. The sizer will not deviate from this size unless such
   * deviation is required to fit into the available layout space.
   *
   * #### Notes
   * There is no limit to this value, but it will be clamped to the
   * bounds defined by [[minSize]] and [[maxSize]].
   *
   * The default value is `0`.
   */
  sizeHint = 0;

  /**
   * The minimum size of the sizer.
   *
   * The sizer will never be sized less than this value, even if
   * it means the sizer will overflow the available layout space.
   *
   * #### Notes
   * It is assumed that this value lies in the range `[0, Infinity)`
   * and that it is `<=` to [[maxSize]]. Failure to adhere to this
   * constraint will yield undefined results.
   *
   * The default value is `0`.
   */
  minSize = 0;

  /**
   * The maximum size of the sizer.
   *
   * The sizer will never be sized greater than this value, even if
   * it means the sizer will underflow the available layout space.
   *
   * #### Notes
   * It is assumed that this value lies in the range `[0, Infinity]`
   * and that it is `>=` to [[minSize]]. Failure to adhere to this
   * constraint will yield undefined results.
   *
   * The default value is `Infinity`.
   */
  maxSize = Infinity;

  /**
   * The stretch factor for the sizer.
   *
   * This controls how much the sizer stretches relative to its sibling
   * sizers when layout space is distributed. A stretch factor of zero
   * is special and will cause the sizer to only be resized after all
   * other sizers with a stretch factor greater than zero have been
   * resized to their limits.
   *
   * #### Notes
   * It is assumed that this value is an integer that lies in the range
   * `[0, Infinity)`. Failure to adhere to this constraint will yield
   * undefined results.
   *
   * The default value is `1`.
   */
  stretch = 1;

  /**
   * The computed size of the sizer.
   *
   * This value is the output of a call to [[boxCalc]]. It represents
   * the computed size for the object along the layout orientation,
   * and will always lie in the range `[minSize, maxSize]`.
   *
   * #### Notes
   * This value is output only. Changing the value will have no effect.
   */
  size = 0;

  /**
   * An internal storage property for the layout algorithm.
   *
   * #### Notes
   * This value is used as temporary storage by the layout algorithm.
   * Changing the value will have no effect.
   */
  done = false;
}


/**
 * Compute the optimal layout sizes for an array of box sizers.
 *
 * This distributes the available layout space among the box sizers
 * according to the following algorithm:
 *
 * 1. Initialize the sizers's size to its size hint and compute the
 *    sums for each of size hint, min size, and max size.
 *
 * 2. If the total size hint equals the available space, return.
 *
 * 3. If the available space is less than the total min size, set all
 *    sizers to their min size and return.
 *
 * 4. If the available space is greater than the total max size, set
 *    all sizers to their max size and return.
 *
 * 5. If the layout space is less than the total size hint, distribute
 *    the negative delta as follows:
 *
 *    a. Shrink each sizer with a stretch factor greater than zero by
 *       an amount proportional to the negative space and the sum of
 *       stretch factors. If the sizer reaches its min size, remove
 *       it and its stretch factor from the computation.
 *
 *    b. If after adjusting all stretch sizers there remains negative
 *       space, distribute the space equally among the sizers with a
 *       stretch factor of zero. If a sizer reaches its min size,
 *       remove it from the computation.
 *
 * 6. If the layout space is greater than the total size hint,
 *    distribute the positive delta as follows:
 *
 *    a. Expand each sizer with a stretch factor greater than zero by
 *       an amount proportional to the positive space and the sum of
 *       stretch factors. If the sizer reaches its max size, remove
 *       it and its stretch factor from the computation.
 *
 *    b. If after adjusting all stretch sizers there remains positive
 *       space, distribute the space equally among the sizers with a
 *       stretch factor of zero. If a sizer reaches its max size,
 *       remove it from the computation.
 *
 * 7. return
 *
 * @param sizers - The sizers for a particular layout line.
 *
 * @param space - The available layout space for the sizers.
 *
 * #### Notes
 * This function can be called at any time to recompute the layout
 * sizing for an existing array of sizers. The previously computed
 * results will have no effect on the new output. It is therefore
 * not necessary to create new sizers on each resize event.
 */
export
function boxCalc(sizers: BoxSizer[], space: number): void {
  // Bail early if there is nothing to do.
  let count = sizers.length;
  if (count === 0) {
    return;
  }

  // Setup the size and stretch counters.
  let totalMin = 0;
  let totalMax = 0;
  let totalSize = 0;
  let totalStretch = 0;
  let stretchCount = 0;

  // Setup the sizers and compute the totals.
  for (let i = 0; i < count; ++i) {
    let sizer = sizers[i];
    initSizer(sizer);
    totalSize += sizer.size;
    totalMin += sizer.minSize;
    totalMax += sizer.maxSize;
    if (sizer.stretch > 0) {
      totalStretch += sizer.stretch;
      stretchCount++;
    }
  }

  // If the space is equal to the total size, return.
  if (space === totalSize) {
    return;
  }

  // If the space is less than the total min, minimize each sizer.
  if (space <= totalMin) {
    for (let i = 0; i < count; ++i) {
      let sizer = sizers[i];
      sizer.size = sizer.minSize;
    }
    return;
  }

  // If the space is greater than the total max, maximize each sizer.
  if (space >= totalMax) {
    for (let i = 0; i < count; ++i) {
      let sizer = sizers[i];
      sizer.size = sizer.maxSize;
    }
    return;
  }

  // The loops below perform sub-pixel precision sizing. A near zero
  // value is used for compares instead of zero to ensure that the
  // loop terminates when the subdivided space is reasonably small.
  let nearZero = 0.01;

  // A counter which is decremented each time a sizer is resized to
  // its limit. This ensures the loops terminate even if there is
  // space remaining to distribute.
  let notDoneCount = count;

  // Distribute negative delta space.
  if (space < totalSize) {
    // Shrink each stretchable sizer by an amount proportional to its
    // stretch factor. If a sizer reaches its min size it's marked as
    // done. The loop progresses in phases where each sizer is given
    // a chance to consume its fair share for the pass, regardless of
    // whether a sizer before it reached its limit. This continues
    // until the stretchable sizers or the free space is exhausted.
    let freeSpace = totalSize - space;
    while (stretchCount > 0 && freeSpace > nearZero) {
      let distSpace = freeSpace;
      let distStretch = totalStretch;
      for (let i = 0; i < count; ++i) {
        let sizer = sizers[i];
        if (sizer.done || sizer.stretch === 0) {
          continue;
        }
        let amt = sizer.stretch * distSpace / distStretch;
        if (sizer.size - amt <= sizer.minSize) {
          freeSpace -= sizer.size - sizer.minSize;
          totalStretch -= sizer.stretch;
          sizer.size = sizer.minSize;
          sizer.done = true;
          notDoneCount--;
          stretchCount--;
        } else {
          freeSpace -= amt;
          sizer.size -= amt;
        }
      }
    }
    // Distribute any remaining space evenly among the non-stretchable
    // sizers. This progresses in phases in the same manner as above.
    while (notDoneCount > 0 && freeSpace > nearZero) {
      let amt = freeSpace / notDoneCount;
      for (let i = 0; i < count; ++i) {
        let sizer = sizers[i];
        if (sizer.done) {
          continue;
        }
        if (sizer.size - amt <= sizer.minSize) {
          freeSpace -= sizer.size - sizer.minSize;
          sizer.size = sizer.minSize;
          sizer.done = true;
          notDoneCount--;
        } else {
          freeSpace -= amt;
          sizer.size -= amt;
        }
      }
    }
  }
  // Distribute positive delta space.
  else {
    // Expand each stretchable sizer by an amount proportional to its
    // stretch factor. If a sizer reaches its max size it's marked as
    // done. The loop progresses in phases where each sizer is given
    // a chance to consume its fair share for the pass, regardless of
    // whether a sizer before it reached its limit. This continues
    // until the stretchable sizers or the free space is exhausted.
    let freeSpace = space - totalSize;
    while (stretchCount > 0 && freeSpace > nearZero) {
      let distSpace = freeSpace;
      let distStretch = totalStretch;
      for (let i = 0; i < count; ++i) {
        let sizer = sizers[i];
        if (sizer.done || sizer.stretch === 0) {
          continue;
        }
        let amt = sizer.stretch * distSpace / distStretch;
        if (sizer.size + amt >= sizer.maxSize) {
          freeSpace -= sizer.maxSize - sizer.size;
          totalStretch -= sizer.stretch;
          sizer.size = sizer.maxSize;
          sizer.done = true;
          notDoneCount--;
          stretchCount--;
        } else {
          freeSpace -= amt;
          sizer.size += amt;
        }
      }
    }
    // Distribute any remaining space evenly among the non-stretchable
    // sizers. This progresses in phases in the same manner as above.
    while (notDoneCount > 0 && freeSpace > nearZero) {
      let amt = freeSpace / notDoneCount;
      for (let i = 0; i < count; ++i) {
        let sizer = sizers[i];
        if (sizer.done) {
          continue;
        }
        if (sizer.size + amt >= sizer.maxSize) {
          freeSpace -= sizer.maxSize - sizer.size;
          sizer.size = sizer.maxSize;
          sizer.done = true;
          notDoneCount--;
        } else {
          freeSpace -= amt;
          sizer.size += amt;
        }
      }
    }
  }
}


/**
 * (Re)initialize a box sizer's data for a layout pass.
 */
function initSizer(sizer: BoxSizer): void {
  sizer.size = Math.max(sizer.minSize, Math.min(sizer.sizeHint, sizer.maxSize));
  sizer.done = false;
}
