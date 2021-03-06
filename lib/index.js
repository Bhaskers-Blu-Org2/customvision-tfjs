"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ClassificationModel = exports.ObjectDetectionModel = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var tf = _interopRequireWildcard(require("@tensorflow/tfjs"));

var Model =
/*#__PURE__*/
function () {
  function Model() {
    (0, _classCallCheck2["default"])(this, Model);
    this.NEW_OD_OUTPUT_TENSORS = ['detected_boxes', 'detected_scores', 'detected_classes'];
  }

  (0, _createClass2["default"])(Model, [{
    key: "loadModelAsync",
    value: function loadModelAsync(modelUrl) {
      var options,
          _args = arguments;
      return _regenerator["default"].async(function loadModelAsync$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              options = _args.length > 1 && _args[1] !== undefined ? _args[1] : null;
              _context.next = 3;
              return _regenerator["default"].awrap(tf.loadGraphModel(modelUrl, options));

            case 3:
              this.model = _context.sent;
              this.input_size = this.model.inputs[0].shape[1];
              this.is_new_od_model = this.model.inputs.length == 3;

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "dispose",
    value: function dispose() {
      this.model.dispose();
    }
  }, {
    key: "executeAsync",
    value: function executeAsync(pixels) {
      var inputs, outputs, arrays;
      return _regenerator["default"].async(function executeAsync$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              inputs = pixels instanceof tf.Tensor ? pixels : this._preprocess(tf.browser.fromPixels(pixels, 3));
              _context2.next = 3;
              return _regenerator["default"].awrap(this.model.executeAsync(inputs, this.is_new_od_model ? this.NEW_OD_OUTPUT_TENSORS : null));

            case 3:
              outputs = _context2.sent;
              arrays = !Array.isArray(outputs) ? outputs.array() : Promise.all(outputs.map(function (t) {
                return t.array();
              }));
              _context2.t0 = _regenerator["default"];
              _context2.t1 = this;
              _context2.next = 9;
              return _regenerator["default"].awrap(arrays);

            case 9:
              _context2.t2 = _context2.sent;
              _context2.t3 = _context2.t1._postprocess.call(_context2.t1, _context2.t2);
              _context2.next = 13;
              return _context2.t0.awrap.call(_context2.t0, _context2.t3);

            case 13:
              return _context2.abrupt("return", _context2.sent);

            case 14:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "_postprocess",
    value: function _postprocess(outputs) {
      return _regenerator["default"].async(function _postprocess$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              return _context3.abrupt("return", outputs);

            case 1:
            case "end":
              return _context3.stop();
          }
        }
      });
    }
  }]);
  return Model;
}();

var ObjectDetectionModel =
/*#__PURE__*/
function (_Model) {
  (0, _inherits2["default"])(ObjectDetectionModel, _Model);

  function ObjectDetectionModel() {
    var _this;

    (0, _classCallCheck2["default"])(this, ObjectDetectionModel);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(ObjectDetectionModel).call(this));
    _this.ANCHORS = [0.573, 0.677, 1.87, 2.06, 3.34, 5.47, 7.88, 3.53, 9.77, 9.17];
    return _this;
  }

  (0, _createClass2["default"])(ObjectDetectionModel, [{
    key: "_preprocess",
    value: function _preprocess(image) {
      var rgb_image = tf.image.resizeBilinear(image.expandDims().toFloat(), [this.input_size, this.input_size]);
      return this.is_new_od_model ? rgb_image : rgb_image.reverse(-1); // RGB->BGR for old models
    }
  }, {
    key: "_postprocess",
    value: function _postprocess(outputs) {
      var num_anchor, channels, height, width, num_class, boxes, scores, classes, grid_y, grid_x, offset, i, x, y, w, h, objectness, class_probabilities, max_index, selected_indices;
      return _regenerator["default"].async(function _postprocess$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (!(outputs.length == 3)) {
                _context4.next = 2;
                break;
              }

              return _context4.abrupt("return", outputs);

            case 2:
              // TODO: Need more efficient implmentation
              num_anchor = this.ANCHORS.length / 2;
              channels = outputs[0][0][0].length;
              height = outputs[0].length;
              width = outputs[0][0].length;
              num_class = channels / num_anchor - 5;
              boxes = [];
              scores = [];
              classes = [];

              for (grid_y = 0; grid_y < height; grid_y++) {
                for (grid_x = 0; grid_x < width; grid_x++) {
                  offset = 0;

                  for (i = 0; i < num_anchor; i++) {
                    x = (this._logistic(outputs[0][grid_y][grid_x][offset++]) + grid_x) / width;
                    y = (this._logistic(outputs[0][grid_y][grid_x][offset++]) + grid_y) / height;
                    w = Math.exp(outputs[0][grid_y][grid_x][offset++]) * this.ANCHORS[i * 2] / width;
                    h = Math.exp(outputs[0][grid_y][grid_x][offset++]) * this.ANCHORS[i * 2 + 1] / height;
                    objectness = tf.scalar(this._logistic(outputs[0][grid_y][grid_x][offset++]));
                    class_probabilities = tf.tensor1d(outputs[0][grid_y][grid_x].slice(offset, offset + num_class)).softmax();
                    offset += num_class;
                    class_probabilities = class_probabilities.mul(objectness);
                    max_index = class_probabilities.argMax();
                    boxes.push([x - w / 2, y - h / 2, x + w / 2, y + h / 2]);
                    scores.push(class_probabilities.max().dataSync()[0]);
                    classes.push(max_index.dataSync()[0]);
                  }
                }
              }

              boxes = tf.tensor2d(boxes);
              scores = tf.tensor1d(scores);
              classes = tf.tensor1d(classes);
              _context4.next = 16;
              return _regenerator["default"].awrap(tf.image.nonMaxSuppressionAsync(boxes, scores, 10));

            case 16:
              selected_indices = _context4.sent;
              _context4.next = 19;
              return _regenerator["default"].awrap(boxes.gather(selected_indices).array());

            case 19:
              _context4.t0 = _context4.sent;
              _context4.next = 22;
              return _regenerator["default"].awrap(scores.gather(selected_indices).array());

            case 22:
              _context4.t1 = _context4.sent;
              _context4.next = 25;
              return _regenerator["default"].awrap(classes.gather(selected_indices).array());

            case 25:
              _context4.t2 = _context4.sent;
              return _context4.abrupt("return", [_context4.t0, _context4.t1, _context4.t2]);

            case 27:
            case "end":
              return _context4.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "_logistic",
    value: function _logistic(x) {
      if (x > 0) {
        return 1 / (1 + Math.exp(-x));
      } else {
        var e = Math.exp(x);
        return e / (1 + e);
      }
    }
  }]);
  return ObjectDetectionModel;
}(Model);

exports.ObjectDetectionModel = ObjectDetectionModel;

var ClassificationModel =
/*#__PURE__*/
function (_Model2) {
  (0, _inherits2["default"])(ClassificationModel, _Model2);

  function ClassificationModel() {
    (0, _classCallCheck2["default"])(this, ClassificationModel);
    return (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(ClassificationModel).apply(this, arguments));
  }

  (0, _createClass2["default"])(ClassificationModel, [{
    key: "_preprocess",
    value: function _preprocess(image) {
      // CenterCrop
      var _image$shape$slice = image.shape.slice(0, 2),
          _image$shape$slice2 = (0, _slicedToArray2["default"])(_image$shape$slice, 2),
          h = _image$shape$slice2[0],
          w = _image$shape$slice2[1];

      var top = h > w ? (h - w) / 2 : 0;
      var left = h > w ? 0 : (w - h) / 2;
      var size = Math.min(h, w);
      var rgb_image = tf.image.cropAndResize(image.expandDims().toFloat(), [[top / h, left / w, (top + size) / h, (left + size) / w]], [0], [this.input_size, this.input_size]);
      return rgb_image.reverse(-1); // RGB -> BGR;
    }
  }]);
  return ClassificationModel;
}(Model);

exports.ClassificationModel = ClassificationModel;