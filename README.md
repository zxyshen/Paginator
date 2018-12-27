# Paginator 
> 基于jqPaginator的js版本

### 基本参数
| 参数名 | 解释 | 类型 | 默认值 | 
| :------: | :------: | :------: |:------: |
| wrapper | 给Paginator加个wrapper | Sring | '' |
| first | 第一页按钮的html | Sring | ```<li class="first"><a href="###">第一页</a></li>``` |
| prev | 上一页按钮的html | Sring | ```<li class="prev"><a href="###">上一页</a></li>``` |
| next | 下一页按钮的html | Sring | ```<li class="prev"><a href="###">下一页</a></li>``` |
| last | 最后一页按钮的html | Sring | ```<li class="prev"><a href="###">最后一页</a></li>``` |
| page | 每页按钮的html | Sring | ```<li class="prev"><a href="###">{page}</a></li>``` |
| totalPages | 总页数 = totalPages / pageSize | Number | 0 |
| totalPages | 数据总数 | Number | 0 |
| pageSize | 每页显示的数据数 | Number | 0 |
| currentPage | 当前页 | Number | 1 |
| visiblePages | 可见页 | Number | 7 |
| disableClass | 当翻页按钮为不可选时的class | String | 'disabled' |
| activeClass | 当翻页按钮被选中时的class | String | 'active' |
| onPageChange | 当翻页按钮被点击时触发 | Function | null |

### 使用示例
```
new Paginator(document.querySelector('#page'),{
  totalPages: {{totalPages}},
  visiblePages: 8,
  currentPage: {{page}},
  onPageChange: function(num, type) {
    if (type === 'change') {
      location.href = '{{__ROOT__}}/admin/article/list?page=' + num
    }
  }
})
```

```
router.get(['/', '/list'], async ctx => {
  const page = ctx.query.page || 1
  const totalCount = await DBhelper.find('article', { opt: {}, count: true })
  const PAGE_SIZE = 3
  let result = await DBhelper.find('article', {
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    opt: {}
  })

  await ctx.render('admin/article/list', {
    list: result,
    page,
    totalPage: Math.ceil(totalCount / PAGE_SIZE)
  })
})
```
