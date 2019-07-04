var _ = require('lodash')
var moment = require('moment')
var fs = require('fs')
var path = require('path')
var utils = {
  getCrtPath (relativePath) {
    return path.join(__dirname, relativePath)
  },
  isSameValueOnPos (obj, key, value) {
    return _.get(obj, key) === value
  },
  writeStringToFile (targetPath, ctn) {
    if (!_.isString(ctn)) {
      ctn = JSON.stringify(ctn)
    }
    return fs.writeFileSync(targetPath, ctn)
  },
  writeStringToRelativeFile (targetPath, ctn) {
    return utils.writeStringToFile(utils.getCrtPath(targetPath), ctn)
  },
  readFileToString (targetPath) {
    return fs.readFileSync(targetPath, 'UTF-8')
  },
  readRelativeFileToString (targetPath) {
    return utils.readFileToString(utils.getCrtPath(targetPath))
  },
  log (str) {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]: ${JSON.stringify(str)}`)
  },
  isDir (path) {
    var info = fs.statSync(path)
    return info.isDir()
  },
  isFile (path) {
    var info = fs.statSync(path)
    return info.isFile()
  }
}
var babelStr = utils.readRelativeFileToString('babelrc.json')
var babelrc = JSON.parse(babelStr)
var parser = require('@babel/parser')
var core = require('@babel/core')
var traverse = require('@babel/traverse').default
var generate = require('@babel/generator').default
var t = require('@babel/types')
var template = require('@babel/template').default
var { transform } = core

// var astOptions = {
//   plugins: babelrc.plugins
// }
var astOptions = babelrc

var defineValues = {
  source: utils.getCrtPath('source'),
  target: utils.getCrtPath('target')
}

async function taskEntry () {
  utils.log(`开始运行任务，定义值 -> ${JSON.stringify(defineValues)}`)
  var { source, target } = defineValues
  var filestr = utils.readRelativeFileToString('./source/test.js')
  var crtAstValue = core.parse(filestr, astOptions)
  traverse(crtAstValue, {
    enter (path) {
      var pathType = _.get(path, 'node.type')
      if (pathType === 'JSXOpeningElement') {
        if (
					utils.isSameValueOnPos(path, 'node.name.type', 'JSXMemberExpression') &&
					utils.isSameValueOnPos(path, 'node.name.object.type', 'JSXIdentifier') &&
					utils.isSameValueOnPos(path, 'node.name.object.name', 'Form') &&
					utils.isSameValueOnPos(path, 'node.name.property.type', 'JSXIdentifier') &&
					utils.isSameValueOnPos(path, 'node.name.property.name', 'Item')
				) {
          var Ast_FormItemJsx = _.get(path, 'parent')
          var Ast_FormItemOperating = path
          var Ast_FormItemOperatingAttrs = _.get(path, 'node.attributes')
          var Ast_FormItemLabelAttr = null
          var Ast_FormatMessage = null
          _.forEach(Ast_FormItemOperatingAttrs, eachAttr => {
            utils.log(eachAttr)
            if (
							utils.isSameValueOnPos(eachAttr, 'name.name', 'label') &&
							utils.isSameValueOnPos(eachAttr, 'value.expression.type', 'CallExpression') &&
							utils.isSameValueOnPos(eachAttr, 'value.expression.callee.name', 'formatMessage')
						) {
              Ast_FormItemLabelAttr = eachAttr
              Ast_FormatMessage = _.get(eachAttr, 'value.expression')
            }
          })
					// 证明是Form.Item而且带有formatMessage函数值的label属性
          if (!_.isNil(Ast_FormItemLabelAttr)) {
            utils.log('got form item attr label')
            var Ast_FormItemChildren = _.get(Ast_FormItemJsx, 'children')
            var Ast_FormItemGetFieldsDecorator = null
            var Ast_FieldStr = null
            var Str_FieldsName = null
            _.forEach(Ast_FormItemChildren, eachItemChildren => {
              if (
								utils.isSameValueOnPos(eachItemChildren, 'type', 'JSXExpressionContainer') &&
								utils.isSameValueOnPos(eachItemChildren, 'expression.type', 'CallExpression') &&
								utils.isSameValueOnPos(
									eachItemChildren,
									'expression.callee.property.name',
									'getFieldDecorator'
								)
							) {
                Ast_FormItemGetFieldsDecorator = eachItemChildren
                Str_FieldsName = _.get(eachItemChildren, 'expression.arguments.0.value')
                Ast_FieldStr = _.get(eachItemChildren, 'expression.arguments.0')
              }
            })
            if (!_.isNil(Ast_FormItemGetFieldsDecorator)) {
              utils.log('got fields name, and jsx label attr ref')
              var replaceJsx = `<ErrorTooltip form={form} formName={'${Str_FieldsName}'} /> `
              var Program_replace = core.parse(replaceJsx, astOptions)
              traverse(Program_replace, {
                enter (path) {
                  if (utils.isSameValueOnPos(path, 'node.type', 'JSXOpeningElement')) {
                    var firstAttr = _.cloneDeep(_.get(path, 'node.attributes.0'))
                    firstAttr.value.expression = Ast_FormatMessage;
                    path.node.attributes.push(firstAttr)
                    }
                }
              })
              var Ast_replaceCtn = _.get(Program_replace, 'program.body.0.expression')
              Ast_FormItemLabelAttr.value.expression = Ast_replaceCtn
            }
          }
        }
      }
    }
  })

  var result = core.transformFromAst(crtAstValue, astOptions)
  utils.writeStringToRelativeFile('./target/test.js', result.code)
  utils.log('完成本次任务')
}

taskEntry()

// var calleeName = _.get(path,'node.callee.name')
// if(!_.isNil(pathType)){
// if(pathType === 'CallExpression'){
//     if(calleeName === 'formatMessage'){
//         var isContainFormItemParent
//         console.log(pathType)
//     }
// }
// }
