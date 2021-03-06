'use strict';

const Turf = require('turf');
const isUndefined = require('lodash/isUndefined');
const objectAssign = require('object-assign');
const Logger = require('../logger');

function binaryDasymetricWeightingRelative(source, target, options, progress) {

  const binaryMask = objectAssign({}, options.binary);

  // binaryMask.features = binaryMask.features.filter(d => {
  //   return d.properties.binary == 1;
  // });

  const Asp = intersect(source, binaryMask);
  const Atsp = intersect(Asp, target);

  target.features.forEach(dt => {
    let result = 0;
    const intersectData = getIntersectingFeatures(Atsp.features, dt);
    const sourceFeatures = intersectData[0];
    const intersects = intersectData[1];

    intersects.forEach((d,i) => {
      const Atsp2 = Turf.area(d);
      const Ps = d.properties[options.attr];
      const At = Turf.area(dt);
      result += (Atsp2 * Ps) / At;
    });


    dt.properties[options.attr] = result;
  });

  return target;
}

function getIntersectingFeatures(sourceFeatures, targetFeature) {
  let intersects = [];
  let featureSimpl = targetFeature;

  const sourceList = sourceFeatures.filter(f => {
    let intersection = Turf.intersect(featureSimpl, f);

    if(!isUndefined(intersection)) {
      intersection.properties = f.properties;

      if(f.properties.binary !== 0) {
        intersects.push(intersection);
      }
    }

    return !isUndefined(intersection)// && f.properties.binary !== 0;
  });

  return [sourceList, intersects];
}

function intersect(a, b) {
  let resultFeatures = [];

  a.features.forEach((d, i) => {
	Logger.info(`[binaryDasymetricWeightingRelative][intersect][${i}/${a.features.length}]`);

	b.features.forEach(e => {
      let isIntersect = null;
      try {
        isIntersect = Turf.intersect(d, e);
      } catch(e) { return; }

      if(isIntersect) {
        isIntersect.properties = d.properties;
        isIntersect.properties.parentArea = Turf.area(d);
        resultFeatures.push(isIntersect);
      }
    });
  });

  return Turf.featurecollection(resultFeatures);
}

module.exports = binaryDasymetricWeightingRelative;
