var sh = require('shelljs')
var _ = require('lodash')
var moment = require('moment')
var fs = require('fs')
var path = require('path')
var utils = {
  loopFile (mypath, handlefunc) {
    if (utils.isFile(mypath)) {
      handlefunc(mypath)
    } else {
      var mychildren = utils.readDir(mypath)
      _.forEach(mychildren, childName => {
        var fullChildPath = path.join(mypath, childName)
        utils.loopFile(fullChildPath, handlefunc)
      })
    }
  },
  readDir (mypath) {
    return fs.readdirSync(mypath)
  },
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

var astOptions = babelrc

var defineValues = {
  source: utils.getCrtPath('source'),
  target: utils.getCrtPath('target')
}

async function taskEntry () {
  var totalctn = 0
  utils.log(`原始目录: ${defineValues.source}`)
  utils.log(`生成目录: ${defineValues.target}`)
  var { source, target } = defineValues
  sh.rm('-rf',utils.getCrtPath('./replace_target_here')+'/*')
  var targetHandleFile = utils.getCrtPath('./replace_source_here')
  utils.loopFile(targetHandleFile, file => {
    totalctn = totalctn + replaceAstAndWriteIntoTargetFolder(file)
  })
  utils.log(`程序执行完毕，总共替换了${totalctn}次`)
}

taskEntry()

function replaceAstAndWriteIntoTargetFolder (targetHandleFile) {
  utils.log(`开始处理文件: ${targetHandleFile}`)
  var filestr = utils.readFileToString(targetHandleFile)
  var crtAstValue = core.parse(filestr, astOptions)
  var findctn = 0
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
            findctn++
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
              var replaceJsx = `<ErrorTooltip form={form} formName={'${Str_FieldsName}'} /> `
              var Program_replace = core.parse(replaceJsx, astOptions)
              traverse(Program_replace, {
                enter (path) {
                  if (utils.isSameValueOnPos(path, 'node.type', 'JSXOpeningElement')) {
                  var firstAttr = _.cloneDeep(_.get(path, 'node.attributes.0'))
                  firstAttr.value.expression = Ast_FormatMessage
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
  var resultHandleFile = targetHandleFile.replace('replace_source_here', 'replace_target_here')
  var resultHandleParentdir = path.resolve(resultHandleFile, '..')
  sh.mkdir('-p',resultHandleParentdir);
  utils.writeStringToFile(resultHandleFile, result.code)
  utils.log(`处理文件结束: 本次替换了${findctn}次`)
  return findctn
}
